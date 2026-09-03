import { callGemini, hasValidApiKey } from '../utils/gemini.js';
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

  console.log(`[Categorizer] Categorizing ${transactions.length} transactions…`);

  // ── Skip optimisation: if every row already has a category, don't call AI ─
  const needsCategorization = transactions.filter(t => !t.category);
  if (needsCategorization.length === 0) {
    console.log('[Categorizer] All transactions already have categories. Skipping AI call.');
    return transactions;
  }

  let categories = null;

  if (hasValidApiKey()) {
    const txList = needsCategorization
      .map(t => `ID: ${t.id} | Desc: ${t.description} | Amount: ${t.amount} | Type: ${t.type}`)
      .join('\n');

    const prompt = `You are a financial categorizer.
Categorize the following transactions into EXACTLY ONE of these categories:
rent, payroll, cloud/infra, software, marketing, client_income, refund, other

Respond ONLY with a valid JSON array of objects, each with "id" (number) and "category" (string).
Do not include any explanation or markdown fences.

Transactions:
${txList}`;

    try {
      categories = await callGemini(prompt, { json: true });
      if (Array.isArray(categories)) {
        console.log(`[Categorizer] Gemini returned ${categories.length} categories via AI.`);
      }
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        console.log('[Categorizer] Quota exhausted. Using rule-based categorization.');
      } else if (err.message === 'NO_KEY') {
        console.log('[Categorizer] No API key. Using rule-based categorization.');
      } else {
        console.error('[Categorizer] Gemini error, using rule-based fallback:', err.message);
      }
    }
  } else {
    console.log('[Categorizer] No valid Gemini API key. Using rule-based categorization.');
  }

  // Apply categories (AI result or rule-based fallback)
  for (const tx of needsCategorization) {
    let cat = null;

    if (categories && Array.isArray(categories)) {
      const item = categories.find(c => c.id === tx.id || c.id === String(tx.id));
      if (item && item.category) cat = item.category.toLowerCase().trim();
    }

    if (!cat) cat = fallbackCategorize(tx.description, tx.type);

    tx.category = cat;
    updateTransaction(tx.id, { category: cat });
  }

  return transactions;
}
