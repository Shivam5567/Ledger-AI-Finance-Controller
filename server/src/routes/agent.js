import express from 'express';
import { getAllTransactions, setMetadata } from '../db.js';
import { categorizeTransactions } from '../agents/categorizer.js';
import { reconcileTransactions } from '../agents/reconciler.js';
import { detectAnomalies } from '../agents/anomaly.js';
import { generateActions } from '../agents/actionAgent.js';

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
    let transactions = getAllTransactions();
    const total = transactions.length;

    sendEvent({ stage: 'ingest', step: 1, totalSteps: 5, progress: 0.05, message: `Ingesting ${total} transactions...`, count: total });
    await new Promise(r => setTimeout(r, 200)); // brief pause so UI catches the first step

    sendEvent({ stage: 'categorizing', step: 2, totalSteps: 5, progress: 0.2, message: 'Categorizing with AI...' });
    transactions = await categorizeTransactions(transactions);

    sendEvent({ stage: 'reconciling', step: 3, totalSteps: 5, progress: 0.5, message: 'Running reconciliation...' });
    transactions = reconcileTransactions(getAllTransactions());

    sendEvent({ stage: 'anomaly', step: 4, totalSteps: 5, progress: 0.7, message: 'Detecting anomalies...' });
    transactions = await detectAnomalies(getAllTransactions());

    sendEvent({ stage: 'actions', step: 5, totalSteps: 5, progress: 0.9, message: 'Generating action drafts...' });
    transactions = await generateActions(getAllTransactions());

    // Compute summary stats for the complete event
    const finalTxs = getAllTransactions();
    const issueCount = finalTxs.filter(t => t.flags && t.flags.length > 0).length;
    const issueValue = finalTxs
      .filter(t => t.flags && t.flags.length > 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const pendingCount = finalTxs.filter(t => t.action_status === 'pending').length;
    const duplicates = finalTxs.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice'))).length;
    const anomalies = finalTxs.filter(t => t.flags && t.flags.includes('anomaly')).length;
    const unmatched = finalTxs.filter(t => t.flags && t.flags.includes('unmatched_invoice')).length;

    // Save last reviewed timestamp
    setMetadata('last_reviewed_at', new Date().toISOString());
    setMetadata('last_tx_count', String(total));

    sendEvent({
      stage: 'complete',
      step: 5,
      totalSteps: 5,
      progress: 1,
      message: `Done — ${issueCount} issues found`,
      issueCount,
      issueValue,
      pendingCount,
      duplicates,
      anomalies,
      unmatched,
      data: finalTxs
    });

    res.end();
  } catch (error) {
    console.error('Pipeline error:', error);
    sendEvent({ stage: 'error', progress: 0, message: error.message });
    res.end();
  }
});

export default router;
