import express from 'express';
import { getAllTransactions } from '../db.js';
import { categorizeTransactions } from '../agents/categorizer.js';
import { reconcileTransactions } from '../agents/reconciler.js';
import { detectAnomalies } from '../agents/anomaly.js';
import { generateActions } from '../agents/actionAgent.js';

const router = express.Router();

router.post('/run', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let transactions = getAllTransactions();

    sendEvent({ stage: 'categorizing', progress: 0.2, message: 'Categorizing transactions with AI...' });
    transactions = await categorizeTransactions(transactions);

    sendEvent({ stage: 'reconciling', progress: 0.5, message: 'Reconciling invoices...' });
    transactions = reconcileTransactions(getAllTransactions());

    // 1.5s pacing delay to stay under Google's 5 RPM limit
    await new Promise(r => setTimeout(r, 1500));

    sendEvent({ stage: 'anomaly', progress: 0.7, message: 'Detecting anomalies...' });
    transactions = await detectAnomalies(getAllTransactions());

    // 1.5s pacing delay to stay under Google's 5 RPM limit
    await new Promise(r => setTimeout(r, 1500));

    sendEvent({ stage: 'actions', progress: 0.9, message: 'Generating action drafts...' });
    transactions = await generateActions(getAllTransactions());

    sendEvent({ stage: 'complete', progress: 1, message: 'Pipeline complete', data: getAllTransactions() });
    res.end();
  } catch (error) {
    console.error("Pipeline error:", error);
    sendEvent({ stage: 'error', progress: 0, message: error.message });
    res.end();
  }
});

export default router;
