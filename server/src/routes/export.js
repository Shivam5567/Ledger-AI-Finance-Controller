import express from 'express';
import { getAllTransactions } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let txs = getAllTransactions();

    if (startDate) {
      txs = txs.filter(t => t.date >= startDate);
    }
    if (endDate) {
      txs = txs.filter(t => t.date <= endDate);
    }
    if (status === 'reconciled') {
      txs = txs.filter(t => t.match_status !== 'exception' && (!t.flags || t.flags.length === 0));
    } else if (status === 'exceptions') {
      txs = txs.filter(t => t.match_status === 'exception' || (t.flags && t.flags.length > 0));
    }

    const filename = startDate && endDate
      ? `ledger-export-${startDate}-to-${endDate}.csv`
      : 'ledger-export.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const headers = [
      'ID',
      'Date',
      'Description',
      'Amount (INR)',
      'Type',
      'Category',
      'Flags',
      'Reconciliation Status',
      'Exception Reason',
      'Action Status',
      'Invoice Ref'
    ];

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
      tx.match_status || 'matched',
      escape(tx.exception_reason || tx.anomaly_explanation || ''),
      tx.action_status || 'none',
      tx.invoice_ref || ''
    ].join(','));

    res.send([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
