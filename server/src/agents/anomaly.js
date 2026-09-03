import { updateTransaction } from '../db.js';
import { callGemini, hasValidApiKey } from '../utils/gemini.js';

export async function detectAnomalies(transactions) {
  console.log(`[Anomaly] Running anomaly detection on ${transactions.length} transactions…`);

  // ── Step 1: Per-category expense stats ────────────────────────────────────
  const categoryStats = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category) {
      if (!categoryStats[tx.category]) {
        categoryStats[tx.category] = { sum: 0, count: 0 };
      }
      categoryStats[tx.category].sum   += tx.amount;
      categoryStats[tx.category].count += 1;
    }
  }

  // ── Step 2: Flag exact duplicates (same description + amount within 5 days) ─
  for (let i = 0; i < transactions.length; i++) {
    const tx1   = transactions[i];
    const date1 = new Date(tx1.date).getTime();
    let isDuplicate = false;

    for (let j = 0; j < transactions.length; j++) {
      if (i === j) continue;
      const tx2 = transactions[j];
      if (tx1.description === tx2.description && tx1.amount === tx2.amount) {
        const diffDays = Math.abs(date1 - new Date(tx2.date).getTime()) / 86_400_000;
        if (diffDays <= 5) { isDuplicate = true; break; }
      }
    }

    if (isDuplicate) {
      const flags = new Set(tx1.flags || []);
      flags.add('duplicate');
      tx1.flags       = Array.from(flags);
      tx1.confidence  = 'high';
      if (!tx1.anomaly_explanation) {
        tx1.anomaly_explanation =
          `Flagged: Exact duplicate detected — ${tx1.description} for ` +
          `$${tx1.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
      }
      updateTransaction(tx1.id, { flags: tx1.flags, anomaly_explanation: tx1.anomaly_explanation });
    }
  }

  // ── Step 3: Flag statistical expense anomalies (>2× category baseline) ────
  const anomalousTxs = [];
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category || !categoryStats[tx.category]) continue;

    const stats = categoryStats[tx.category];
    const baselineAvg = stats.count > 1
      ? (stats.sum - tx.amount) / (stats.count - 1)
      : stats.sum / stats.count;
    const totalAvg = stats.sum / stats.count;

    const isAnomaly =
      (baselineAvg > 0 && tx.amount > baselineAvg * 2) ||
      (tx.amount > totalAvg * 1.5 && stats.count > 1);

    if (isAnomaly) {
      const flags = new Set(tx.flags || []);
      flags.add('anomaly');
      tx.flags      = Array.from(flags);
      tx.confidence = tx.amount > (baselineAvg || totalAvg) * 3 ? 'high' : 'medium';
      tx.baselineAvg = baselineAvg || totalAvg;
      tx.multiplier  = (tx.amount / (baselineAvg || totalAvg)).toFixed(1);
      anomalousTxs.push(tx);
      updateTransaction(tx.id, { flags: tx.flags });
    }
  }

  // ── Step 4: AI explanations — only for anomalies that don't have one yet ──
  if (anomalousTxs.length > 0) {
    const needsExplanation = anomalousTxs.filter(t => !t.anomaly_explanation);

    if (needsExplanation.length > 0 && hasValidApiKey()) {
      const itemsList = needsExplanation
        .map(t =>
          `ID: ${t.id} | Desc: ${t.description} | Amount: $${t.amount} | ` +
          `Category: ${t.category} | Baseline Avg: $${t.baselineAvg.toFixed(2)} | Multiplier: ${t.multiplier}x`
        )
        .join('\n');

      const prompt =
        `For each anomalous expense below, write a short 1-sentence plain-English explanation ` +
        `starting with "Flagged: ". Be specific about the amount and multiplier.\n` +
        `Return ONLY a valid JSON array: [{"id": number, "explanation": string}]\n\n` +
        `Transactions:\n${itemsList}`;

      try {
        const results = await callGemini(prompt, { json: true });
        if (Array.isArray(results)) {
          for (const item of results) {
            const tx = needsExplanation.find(t => t.id === item.id || t.id === Number(item.id));
            if (tx && item.explanation) {
              tx.anomaly_explanation = item.explanation.trim();
              updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
            }
          }
        }
      } catch (err) {
        if (err.message === 'RATE_LIMIT') {
          console.log('[Anomaly] Quota exhausted. Using template explanations.');
        } else if (err.message !== 'NO_KEY') {
          console.error('[Anomaly] Gemini explanation error:', err.message);
        }
      }
    }

    // Fill in template explanations for anything still missing
    for (const tx of anomalousTxs) {
      if (!tx.anomaly_explanation) {
        tx.anomaly_explanation =
          `Flagged: ${tx.description} charge ` +
          `($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) ` +
          `is ${tx.multiplier}x your category average ` +
          `($${tx.baselineAvg.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
        updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
      }
    }
  }

  return transactions;
}
