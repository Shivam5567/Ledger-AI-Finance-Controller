import { updateTransaction } from '../db.js';
import { callGemini } from '../utils/gemini.js';

export async function detectAnomalies(transactions) {
  // Step 1: Compute average amount per category for expenses
  const categoryStats = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category) {
      if (!categoryStats[tx.category]) {
        categoryStats[tx.category] = { sum: 0, count: 0 };
      }
      categoryStats[tx.category].sum += tx.amount;
      categoryStats[tx.category].count += 1;
    }
  }

  const categoryAverages = {};
  for (const [cat, stats] of Object.entries(categoryStats)) {
    categoryAverages[cat] = stats.sum / stats.count;
  }

  // Step 2: Find duplicates (same description and amount within 5 days)
  for (let i = 0; i < transactions.length; i++) {
    const tx1 = transactions[i];
    const date1 = new Date(tx1.date).getTime();
    let isDuplicate = false;

    for (let j = 0; j < transactions.length; j++) {
      if (i === j) continue;
      const tx2 = transactions[j];
      
      if (tx1.description === tx2.description && tx1.amount === tx2.amount) {
        const date2 = new Date(tx2.date).getTime();
        const diffDays = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
        if (diffDays <= 5) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (isDuplicate) {
      const flags = new Set(tx1.flags || []);
      flags.add('duplicate');
      tx1.flags = Array.from(flags);
      updateTransaction(tx1.id, { flags: tx1.flags });
    }
  }

  // Find expense anomalies > 2x category avg
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category && categoryAverages[tx.category]) {
      const avg = categoryAverages[tx.category];
      if (tx.amount > avg * 2) {
        const flags = new Set(tx.flags || []);
        flags.add('anomaly');
        tx.flags = Array.from(flags);
        updateTransaction(tx.id, { flags: tx.flags });
      }
    }
  }

  // Step 3: LLM for anomaly explanation
  for (const tx of transactions) {
    if (tx.flags && tx.flags.includes('anomaly') && tx.type === 'expense' && tx.category) {
      const avg = categoryAverages[tx.category];
      const prompt = `
Provide a short, one-line plain-English explanation for why this expense is anomalous.
Transaction: ${tx.description}, Amount: $${tx.amount}, Category: ${tx.category}.
The typical average for this category is $${avg.toFixed(2)}.
Start your response with "Flagged: "
      `;
      try {
        const explanation = await callGemini(prompt);
        tx.anomaly_explanation = explanation.trim();
        updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
      } catch (err) {
        console.error("Anomaly explanation error:", err);
      }
    }
  }

  return transactions;
}
