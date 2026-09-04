import { updateTransaction, isDismissed } from '../db.js';
import { callLLM, extractText, safeParseJSON, hasValidApiKey } from '../utils/llm.js';

export async function detectAnomalies(transactions) {
  console.log(`[Anomaly] Running anomaly detection on ${transactions.length} transactions...`);

  // ── Per-category expense stats ────────────────────────────────────────────
  const categoryStats = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.category) {
      if (!categoryStats[tx.category]) categoryStats[tx.category] = { sum: 0, count: 0 };
      categoryStats[tx.category].sum   += tx.amount;
      categoryStats[tx.category].count += 1;
    }
  }

  // ── Flag exact duplicates (same description + amount within 5 days) ────────
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
      if (isDismissed('duplicate', tx1.description)) {
        tx1.previously_dismissed = true;
      } else {
        const flags = new Set(tx1.flags || []);
        flags.add('duplicate');
        tx1.flags      = Array.from(flags);
        tx1.confidence = 'high';
        if (!tx1.anomaly_explanation) {
          tx1.anomaly_explanation =
            `Flagged: Exact duplicate detected — ${tx1.description} for $${tx1.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;
        }
        tx1.match_status    = 'exception';
        tx1.exception_type  = 'duplicate_payment';
        tx1.exception_reason = `Identical payment to ${tx1.description} found within 5 days — possible double charge`;
        updateTransaction(tx1.id, {
          flags: tx1.flags,
          anomaly_explanation: tx1.anomaly_explanation,
          confidence: tx1.confidence,
          match_status: tx1.match_status,
          exception_type: tx1.exception_type,
          exception_reason: tx1.exception_reason,
        });
      }
    }
  }

  // ── Flag statistical anomalies (>2× category baseline) ──────────────────
  const anomalousTxs = [];
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category || !categoryStats[tx.category]) continue;

    const stats       = categoryStats[tx.category];
    const baselineAvg = stats.count > 1
      ? (stats.sum - tx.amount) / (stats.count - 1)
      : stats.sum / stats.count;
    const totalAvg  = stats.sum / stats.count;
    const isAnomaly =
      (baselineAvg > 0 && tx.amount > baselineAvg * 2) ||
      (tx.amount > totalAvg * 1.5 && stats.count > 1);

    if (isAnomaly && !isDismissed('anomaly', tx.description)) {
      const flags = new Set(tx.flags || []);
      flags.add('anomaly');
      tx.flags       = Array.from(flags);
      tx.confidence  = tx.amount > (baselineAvg || totalAvg) * 3 ? 'high' : 'medium';
      tx.baselineAvg = baselineAvg || totalAvg;
      tx.multiplier  = (tx.amount / (baselineAvg || totalAvg)).toFixed(1);
      tx.match_status    = 'exception';
      tx.exception_type  = 'spend_anomaly';
      tx.exception_reason = `This charge is ${tx.multiplier}x the average ${tx.category} spend of $${tx.baselineAvg.toFixed(2)}`;
      anomalousTxs.push(tx);
      updateTransaction(tx.id, {
        flags: tx.flags,
        confidence: tx.confidence,
        match_status: tx.match_status,
        exception_type: tx.exception_type,
        exception_reason: tx.exception_reason,
      });
    }
  }

  // ── Batch AI explanations for all anomalies without one ──────────────────
  if (anomalousTxs.length > 0) {
    const needsExplanation = anomalousTxs.filter(t => !t.anomaly_explanation);

    if (needsExplanation.length > 0 && hasValidApiKey()) {
      console.log(`[Anomaly] Running batched explanation for ${needsExplanation.length} flagged items (1 API call)...`);

      const itemsList = JSON.stringify(needsExplanation.map(t => ({
        id:          t.id,
        description: t.description,
        amount:      t.amount,
        flag_reason: `${t.multiplier}x category average of $${t.baselineAvg.toFixed(2)}`,
      })), null, 2);

      const prompt = `Write a one-line plain-English explanation for each flagged transaction.
Be specific — include the actual amount and the average it's being compared to.

Flagged transactions:
${itemsList}

Return ONLY a raw JSON array. No explanation, no markdown, no code fences:
[{"id": 5, "explanation": "This AWS charge is 3.2x your typical monthly average of $2,400."}]`;

      try {
        const response = await callLLM(prompt, { model: 'smart' });
        const raw      = extractText(response);
        const results  = safeParseJSON(raw);
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
        if (err.status === 429) console.log('[Anomaly] Rate limit. Using template explanations.');
        else                    console.error('[Anomaly] LLM explanation error:', err.message);
      }
    }

    // Fill template explanations for anything still missing
    for (const tx of anomalousTxs) {
      if (!tx.anomaly_explanation) {
        tx.anomaly_explanation =
          `Flagged: ${tx.description} charge ($${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) ` +
          `is ${tx.multiplier}x your category average ($${tx.baselineAvg.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`;
        updateTransaction(tx.id, { anomaly_explanation: tx.anomaly_explanation });
      }
    }
  }

  return transactions;
}
