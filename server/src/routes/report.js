import express from 'express';
import { getReport } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const report = getReport();
    res.json(report);
  } catch (err) {
    console.error('[Report] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
