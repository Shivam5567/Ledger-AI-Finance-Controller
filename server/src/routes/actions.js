import express from 'express';
import { updateTransaction, getTransactionById } from '../db.js';

const router = express.Router();

router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (tx.action_status !== 'approved') {
      updateTransaction(id, { action_status: 'approved' });
    }
    
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/dismiss', (req, res) => {
  try {
    const { id } = req.params;
    const tx = getTransactionById(id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (tx.action_status !== 'dismissed') {
      updateTransaction(id, { action_status: 'dismissed' });
    }
    
    res.json(getTransactionById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
