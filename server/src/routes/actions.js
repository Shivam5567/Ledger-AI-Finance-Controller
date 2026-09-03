import express from 'express';
import { updateTransaction, getTransactionById, createDismissedRule, getDismissedRules, deleteDismissedRule } from '../db.js';

const router = express.Router();

router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    updateTransaction(id, { action_status: 'approved', resolved_at: new Date().toISOString() });
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
    
    updateTransaction(id, { action_status: 'dismissed', resolved_at: new Date().toISOString() });
    
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
    updateTransaction(id, { action_status: 'pending', resolved_at: null });
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
