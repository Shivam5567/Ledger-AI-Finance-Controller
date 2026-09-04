import express from 'express';
import db, { getAllTransactions, setMetadata, createReconciliationRun } from '../db.js';
import { categorizeTransactions } from '../agents/categorizer.js';
import { reconcileTransactions } from '../agents/reconciler.js';
import { detectAnomalies } from '../agents/anomaly.js';
import { generateActions } from '../agents/actionAgent.js';
import { resetCallCount, getCallCount } from '../utils/llm.js';

const router = express.Router();

router.post('/run', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let startDate = req.body?.startDate || req.query?.startDate || null;
    let endDate = req.body?.endDate || req.query?.endDate || null;
    if (!startDate || !endDate) {
      const minMax = db.prepare('SELECT MIN(date) as minDate, MAX(date) as maxDate FROM transactions').get();
      startDate = startDate || minMax?.minDate || null;
      endDate = endDate || minMax?.maxDate || null;
    }

    resetCallCount();
    const startTime = Date.now();

    let transactions = getAllTransactions();
    const total = transactions.length;

    sendEvent({ stage: 'ingest', step: 1, totalSteps: 5, progress: 0.05, message: `Ingesting ${total} transactions...`, count: total });
    await new Promise(r => setTimeout(r, 200)); // brief pause so UI catches the first step

    sendEvent({ stage: 'categorizing', step: 2, totalSteps: 5, progress: 0.2, message: 'Auditing & categorizing with Groq LLM...' });
    transactions = await categorizeTransactions(transactions, { force: true });

    sendEvent({ stage: 'reconciling', step: 3, totalSteps: 5, progress: 0.5, message: 'Running deterministic ledger reconciliation...' });
    transactions = reconcileTransactions(getAllTransactions());

    sendEvent({ stage: 'anomaly', step: 4, totalSteps: 5, progress: 0.7, message: 'Detecting anomalies & generating LLM explanations...' });
    transactions = await detectAnomalies(getAllTransactions(), { force: true });

    sendEvent({ stage: 'actions', step: 5, totalSteps: 5, progress: 0.9, message: 'Drafting resolution actions with Groq LLM...' });
    transactions = await generateActions(getAllTransactions(), { force: true });

    // Compute summary stats for the complete event — honoring human approvals
    const finalTxs = getAllTransactions();
    const openIssues = finalTxs.filter(t =>
      ((t.flags && t.flags.length > 0) || t.match_status === 'exception') &&
      t.action_status !== 'approved' &&
      t.action_status !== 'dismissed'
    );
    const issueCount = openIssues.length;
    const issueValue = openIssues.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const pendingCount = finalTxs.filter(t => t.action_status === 'pending').length;
    const duplicates = openIssues.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice'))).length;
    const anomalies = openIssues.filter(t => t.flags && t.flags.includes('anomaly')).length;
    const unmatched = openIssues.filter(t => t.flags && t.flags.includes('unmatched_invoice')).length;

    const groqCallCount = getCallCount();
    console.log(`[Pipeline] Complete — ${groqCallCount} Groq API calls used`);

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    const matchedCount = total - issueCount;
    const matchRate = total > 0 ? `${((matchedCount / total) * 100).toFixed(1)}%` : '100%';

    setMetadata('last_reviewed_at', new Date().toISOString());
    setMetadata('last_tx_count', String(total));
    setMetadata('last_run_duration', durationSeconds);
    setMetadata('last_api_calls', String(groqCallCount));
    setMetadata('last_model_used', 'OpenAI GPT-OSS on Groq');

    // Persist completed reconciliation run to SQLite
    createReconciliationRun({
      startDate,
      endDate,
      status: 'COMPLETED',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds,
      totalCount: total,
      matchedCount,
      exceptionCount: issueCount,
      matchRate,
      anomalyCount: anomalies,
      duplicateCount: duplicates,
      unmatchedInvoiceCount: unmatched,
      issueValue,
      callsUsed: groqCallCount,
    });

    sendEvent({
      stage: 'complete',
      step: 5,
      totalSteps: 5,
      progress: 1,
      message: `Reconciliation complete — ${groqCallCount} Groq AI calls used (${durationSeconds}s)`,
      durationSeconds,
      totalCount: total,
      matchedCount,
      matchRate,
      issueCount,
      issueValue,
      pendingCount,
      duplicates,
      anomalies,
      unmatched,
      callsUsed: groqCallCount,
      modelName: 'OpenAI GPT-OSS on Groq',
      data: finalTxs
    });

    res.end();
  } catch (error) {
    console.error('[Pipeline] Error:', error.message);
    sendEvent({ stage: 'error', progress: 0, message: error.message });
    res.end();
  }
});

export default router;
