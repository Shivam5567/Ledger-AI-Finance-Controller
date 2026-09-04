import express from 'express';
import { updateTransaction, getTransactionById, createDismissedRule, deleteDismissedRule } from '../db.js';

const router = express.Router();

router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    // If an income transaction was missing an invoice ref, assign an authorized reference
    let invoice_ref = tx.invoice_ref;
    if ((!invoice_ref || invoice_ref.trim() === '') && (tx.type === 'income' || tx.category === 'client_income')) {
      invoice_ref = `INV-AUTH-${String(id).padStart(4, '0')}`;
    }

    updateTransaction(id, {
      action_status: 'approved',
      match_status: 'matched',
      invoice_ref: invoice_ref || null,
      resolved_at: new Date().toISOString(),
    });
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/dismiss', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    
    updateTransaction(id, {
      action_status: 'dismissed',
      match_status: 'matched',
      resolved_at: new Date().toISOString(),
    });
    
    // Create a dismissed rule so the agent remembers this decision
    if (tx.flags && tx.flags.length > 0) {
      const primaryFlag = tx.flags[0];
      // Use first 4 words of description as pattern for fuzzy matching
      const pattern = tx.description.split(' ').slice(0, 4).join(' ');
      createDismissedRule(primaryFlag, pattern);
    }
    
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reset', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    // If invoice_ref was an auto-assigned authorized reference, clear it on reset
    let invoice_ref = tx.invoice_ref;
    if (invoice_ref && invoice_ref.startsWith('INV-AUTH-')) {
      invoice_ref = null;
    }

    updateTransaction(id, {
      action_status: 'pending',
      match_status: 'exception',
      invoice_ref: invoice_ref,
      resolved_at: null,
    });
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
