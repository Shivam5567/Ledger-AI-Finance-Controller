import express from 'express';
import { getDashboardSummaryData } from '../db.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;

    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: 'Invalid startDate format. Expected YYYY-MM-DD.' });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: 'Invalid endDate format. Expected YYYY-MM-DD.' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate cannot be after endDate.' });
    }

    const summary = getDashboardSummaryData({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      interval: interval === 'monthly' ? 'monthly' : 'weekly',
    });

    res.json(summary);
  } catch (err) {
    console.error('[Dashboard API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
