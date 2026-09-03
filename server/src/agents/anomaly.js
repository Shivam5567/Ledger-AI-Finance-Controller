import { updateTransaction } from '../db.js';
import { callGemini, hasValidApiKey } from '../utils/gemini.js';

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
      tx1.confidence = 'high';
      
      if (!tx1.anomaly_explanation) {
        tx1.anomaly_explanation = `Flagged: Exact duplicate transaction detected (${tx1.description} for $${tx1.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
      }
      updateTransaction(tx1.id, { flags: tx1.flags, anomaly_explanation: tx1.anomaly_explanation });
    }
  }

  // Step 3: Find expense anomalies (>2x baseline average of other transactions in category)
  const anomalousTxs = [];
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category && categoryStats[tx.category]) {
      const stats = categoryStats[tx.category];
      
      let baselineAvg = 0;
      if (stats.count > 1) {
        baselineAvg = (stats.sum - tx.amount) / (stats.count - 1);
      } else {
        baselineAvg = stats.sum / stats.count;
      }

      const totalAvg = stats.sum / stats.count;
      if ((baselineAvg > 0 && tx.amount > baselineAvg * 2) || (tx.amount > totalAvg * 1.5 && stats.count > 1)) {
        const flags = new Set(tx.flags || []);
        flags.add('anomaly');
        tx.flags = Array.from(flags);
        tx.confidence = tx.amount > (baselineAvg || totalAvg) * 3 ? 'high' : 'medium';
        
        const multiplier = (tx.amount / (baselineAvg || totalAvg)).toFixed(1);
        tx.baselineAvg = baselineAvg || totalAvg;
        tx.multiplier = multiplier;
        
        anomalousTxs.push(tx);
        updateTransaction(tx.id, { flags: tx.flags });
      }
    }
  }

  // Step 4: BATCH all anomaly explanations into ONE single Gemini call
  if (anomalousTxs.length > 0) {
    if (hasValidApiKey()) {
      const itemsList = anomalousTxs.map(t => 
        `ID: ${t.id} | Desc: ${t.description} | Amount: $${t.amount} | Category: ${t.category} | Baseline Avg: $${t.baselineAvg.toFixed(2)} | Multiplier: ${t.multiplier}x`
      ).join('\n');

      const prompt = `
For each anomalous expense below, write a short 1-sentence plain-English explanation starting with "Flagged: ".
Return JSON array of objects: [{"id": number, "explanation": string}]

Transactions:
${itemsList}
`;

      try {
        const results = await callGemini(prompt, { json: true });
        if (Array.isArray(results)) {
          for (const item of results) {
            const tx = anomalousTxs.find(t => t.id === item.id);
            if (tx && item.explanation) {
              tx.anomaly_explanation = item.explanation.trim();
              updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
            }
          }
        }
      } catch (err) {
        console.error("[Anomaly] Batched Gemini call failed, using dynamic templates:", err.message);
      }
    }

    // Fallback template for any anomalous transaction missing an explanation
    for (const tx of anomalousTxs) {
      if (!tx.anomaly_explanation) {
        const avg = tx.baselineAvg || 0;
        const mult = tx.multiplier || '2.0';
        tx.anomaly_explanation = `Flagged: this ${tx.description} charge ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) is ${mult}x your category average ($${avg.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
        updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
      }
    }
  }

  return transactions;
}
