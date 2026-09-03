import { callGemini } from '../utils/gemini.js';
import { updateTransaction } from '../db.js';

function fallbackCategorize(description, type) {
  const desc = (description || '').toLowerCase();
  if (type === 'refund' || desc.includes('refund')) return 'refund';
  if (type === 'income' || desc.includes('client payment')) return 'client_income';
  if (desc.includes('rent') || desc.includes('office')) return 'rent';
  if (desc.includes('payroll') || desc.includes('engineering team') || desc.includes('marketing team')) return 'payroll';
  if (desc.includes('aws') || desc.includes('cloud') || desc.includes('azure') || desc.includes('server')) return 'cloud/infra';
  if (desc.includes('google workspace') || desc.includes('slack') || desc.includes('github') || desc.includes('notion') || desc.includes('figma') || desc.includes('hubspot') || desc.includes('crm')) return 'software';
  if (desc.includes('ads') || desc.includes('facebook') || desc.includes('google ads') || desc.includes('campaign')) return 'marketing';
  return 'other';
}

export async function categorizeTransactions(transactions) {
  if (!transactions || transactions.length === 0) return [];

  console.log(`[Categorizer] Categorizing ${transactions.length} transactions...`);

  let categories = null;

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    const txList = transactions.map(t => 
      `ID: ${t.id} | Desc: ${t.description} | Amount: ${t.amount} | Type: ${t.type}`
    ).join('\n');

    const prompt = `
You are a financial categorizer.
Categorize the following transactions into EXACTLY ONE of these categories:
rent, payroll, cloud/infra, software, marketing, client_income, refund, other

Respond strictly with a JSON array of objects, with each object having 'id' (number) and 'category' (string).

Transactions:
${txList}
`;

    try {
      categories = await callGemini(prompt, { json: true });
      console.log(`[Categorizer] Gemini returned ${categories?.length} categories.`);
    } catch (error) {
      console.error("[Categorizer] Gemini API error, using fallback rules:", error.message);
    }
  } else {
    console.log("[Categorizer] GEMINI_API_KEY not set or default placeholder, using rule-based categorization.");
  }

  // Update DB & transactions
  for (const tx of transactions) {
    let cat = null;
    if (categories && Array.isArray(categories)) {
      const item = categories.find(c => c.id === tx.id);
      if (item && item.category) cat = item.category.toLowerCase().trim();
    }
    
    // Fallback if not categorized by Gemini
    if (!cat) {
      cat = fallbackCategorize(tx.description, tx.type);
    }

    tx.category = cat;
    updateTransaction(tx.id, { category: cat });
  }

  return transactions;
}
