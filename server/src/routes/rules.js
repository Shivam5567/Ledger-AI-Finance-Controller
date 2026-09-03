import express from 'express';
import { getDismissedRules, deleteDismissedRule } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    res.json(getDismissedRules());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    deleteDismissedRule(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
