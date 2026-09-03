import express from 'express';
import { getAllTransactions } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const txs = getAllTransactions();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ledger-export.csv"');
    
    const headers = ['id', 'date', 'description', 'amount', 'type', 'category', 'flags', 'confidence', 'action_status', 'invoice_ref', 'anomaly_explanation'];
    
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = txs.map(tx => [
      tx.id,
      tx.date,
      escape(tx.description),
      tx.amount,
      tx.type,
      tx.category || '',
      escape((tx.flags || []).join(' | ')),
      tx.confidence || '',
      tx.action_status || '',
      tx.invoice_ref || '',
      escape(tx.anomaly_explanation || '')
    ].join(','));
    
    res.send([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
