import { updateTransaction } from '../db.js';
import { callGemini } from '../utils/gemini.js';

export async function detectAnomalies(transactions) {
  console.log(`[Anomaly] Running anomaly detection on ${transactions.length} transactions...`);

  // Step 1: Compute average amount per category for expenses
  const categoryStats = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category) {
      if (!categoryStats[tx.category]) {
        categoryStats[tx.category] = { sum: 0, count: 0, txs: [] };
      }
      categoryStats[tx.category].sum += tx.amount;
      categoryStats[tx.category].count += 1;
      categoryStats[tx.category].txs.push(tx);
    }
  }

  // Step 2: Find exact duplicates (same description AND amount within 5 days)
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
      
      // Default explanation if not set
      if (!tx1.anomaly_explanation) {
        tx1.anomaly_explanation = `Flagged: duplicate transaction detected (${tx1.description} for $${tx1.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
      }
      updateTransaction(tx1.id, { flags: tx1.flags, anomaly_explanation: tx1.anomaly_explanation });
    }
  }

  // Step 3: Find expense anomalies (>2x average of OTHER transactions in that category, or >1.5x category average)
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category && categoryStats[tx.category]) {
      const stats = categoryStats[tx.category];
      
      // Calculate baseline average excluding current transaction if count > 1
      let baselineAvg = 0;
      if (stats.count > 1) {
        baselineAvg = (stats.sum - tx.amount) / (stats.count - 1);
      } else {
        baselineAvg = stats.sum / stats.count;
      }

      // Check if current tx is > 2x the baseline average of other transactions in category, or > 1.5x total average
      const totalAvg = stats.sum / stats.count;
      if ((baselineAvg > 0 && tx.amount > baselineAvg * 2) || (tx.amount > totalAvg * 1.5 && stats.count > 1)) {
        const flags = new Set(tx.flags || []);
        flags.add('anomaly');
        tx.flags = Array.from(flags);
        
        const multiplier = (tx.amount / (baselineAvg || totalAvg)).toFixed(1);
        tx.baselineAvg = baselineAvg || totalAvg;
        tx.multiplier = multiplier;
        
        updateTransaction(tx.id, { flags: tx.flags });
      }
    }
  }

  // Step 4: Generate plain-English explanations for anomalies via Gemini (or fallback template)
  for (const tx of transactions) {
    if (tx.flags && tx.flags.includes('anomaly')) {
      const avg = tx.baselineAvg || 0;
      const mult = tx.multiplier || '2.0';
      
      const fallbackMsg = `Flagged: this ${tx.description} charge ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) is ${mult}x your typical monthly average ($${avg.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;

      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        const prompt = `
Provide a short, single-sentence plain-English explanation of why this transaction was flagged as an anomaly.
Transaction: ${tx.description}, Amount: $${tx.amount}, Category: ${tx.category}.
Baseline average for other transactions in this category: $${avg.toFixed(2)}.
This charge is ${mult}x the typical category average.
Start your response strictly with "Flagged: "
`;
        try {
          const explanation = await callGemini(prompt);
          tx.anomaly_explanation = explanation.trim();
        } catch (err) {
          console.error("[Anomaly] Gemini explanation error, using template:", err.message);
          tx.anomaly_explanation = fallbackMsg;
        }
      } else {
        tx.anomaly_explanation = fallbackMsg;
      }

      updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
    }
  }

  return transactions;
}
