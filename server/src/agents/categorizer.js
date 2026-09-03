import { callGemini } from '../utils/gemini.js';
import { updateTransaction } from '../db.js';

export async function categorizeTransactions(transactions) {
  if (!transactions || transactions.length === 0) return [];

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
    const categories = await callGemini(prompt, { json: true });
    
    // Update db
    for (const item of categories) {
      if (item.id && item.category) {
        updateTransaction(item.id, { category: item.category });
      }
    }

    // Return updated from passed array for convenience if needed, 
    // but better to fetch from DB or just mutate in place
    for (const tx of transactions) {
      const catInfo = categories.find(c => c.id === tx.id);
      if (catInfo) {
        tx.category = catInfo.category;
      }
    }
    
    return transactions;

  } catch (error) {
    console.error("Categorizer error:", error);
    return transactions;
  }
}
