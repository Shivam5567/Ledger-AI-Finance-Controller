import { callLLM, extractText, safeParseJSON, hasValidApiKey } from '../utils/llm.js';
import { updateTransaction } from '../db.js';

// ---------------------------------------------------------------------------
// Rule-based fallback (no API required)
// ---------------------------------------------------------------------------
function fallbackCategorize(description, type) {
  const desc = (description || '').toLowerCase();
  if (type === 'refund'  || desc.includes('refund'))                                             return 'refund';
  if (type === 'income'  || desc.includes('client payment'))                                      return 'client_income';
  if (desc.includes('rent')    || desc.includes('office'))                                        return 'rent';
  if (desc.includes('payroll') || desc.includes('engineering team') ||
      desc.includes('marketing team'))                                                             return 'payroll';
  if (desc.includes('aws')  || desc.includes('cloud') ||
      desc.includes('azure') || desc.includes('server'))                                          return 'cloud/infra';
  if (desc.includes('google workspace') || desc.includes('slack') ||
      desc.includes('github') || desc.includes('notion') || desc.includes('figma') ||
      desc.includes('hubspot') || desc.includes('crm'))                                           return 'software';
  if (desc.includes('ads') || desc.includes('facebook') ||
      desc.includes('google ads') || desc.includes('campaign'))                                   return 'marketing';
  return 'other';
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function categorizeTransactions(transactions) {
  if (!transactions || transactions.length === 0) return [];

  // Protection B: Skip already-processed transactions
  const needsCategorization = transactions.filter(t => !t.category || t.category === null);
  if (needsCategorization.length === 0) {
    console.log('[Categorizer] All transactions already categorized — skipping API call');
    return transactions;
  }

  let categories = null;

  if (hasValidApiKey()) {
    console.log(`[Categorizer] Running batched categorization on ${needsCategorization.length} items (1 API call)...`);

    const txList = JSON.stringify(needsCategorization.map(t => ({
      id:          t.id,
      description: t.description,
      amount:      t.amount,
      type:        t.type,
    })), null, 2);

    const prompt = `Categorize these ${needsCategorization.length} transactions into exactly one of:
rent, payroll, cloud/infra, software, marketing, client_income, refund, other.

Transactions:
${txList}

Return ONLY a raw JSON array. No explanation, no markdown, no code fences:
[{"id": 1, "category": "cloud/infra"}, {"id": 2, "category": "payroll"}]`;

    try {
      const response = await callLLM(prompt, { model: 'fast' });
      const raw      = extractText(response);
      categories     = safeParseJSON(raw);
      if (Array.isArray(categories)) {
        console.log(`[Categorizer] LLM returned ${categories.length} categories.`);
      }
    } catch (err) {
      if (err.status === 429) {
        console.log('[Categorizer] Rate limit hit. Using rule-based categorization.');
      } else {
        console.error('[Categorizer] LLM error, using rule-based fallback:', err.message);
      }
    }
  } else {
    console.log('[Categorizer] No valid GROQ_API_KEY. Using rule-based categorization.');
  }

  // Apply categories (AI result or rule-based fallback)
  for (const tx of needsCategorization) {
    let cat = null;

    if (categories && Array.isArray(categories)) {
      const item = categories.find(c => c.id === tx.id || c.id === String(tx.id) || c.id === Number(tx.id));
      if (item && item.category) cat = item.category.toLowerCase().trim();
    }

    if (!cat) cat = fallbackCategorize(tx.description, tx.type);

    tx.category = cat;
    updateTransaction(tx.id, { category: cat });
  }

  return transactions;
}
