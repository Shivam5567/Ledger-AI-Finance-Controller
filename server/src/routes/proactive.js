import express from 'express';
import { getAllTransactions, getMetadata } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const lastReviewedAt = getMetadata('last_reviewed_at');
    const lastTxCount = parseInt(getMetadata('last_tx_count') || '0', 10);
    const currentTxs = getAllTransactions();
    const currentCount = currentTxs.length;
    
    const pendingCount = currentTxs.filter(t => t.action_status === 'pending').length;
    const unmatchedCount = currentTxs.filter(t => t.flags && t.flags.includes('unmatched_invoice')).length;
    const duplicateCount = currentTxs.filter(t => t.flags && (t.flags.includes('duplicate') || t.flags.includes('duplicate_invoice'))).length;
    
    const newTxCount = Math.max(0, currentCount - lastTxCount);
    
    let daysSinceReview = null;
    if (lastReviewedAt) {
      const diff = Date.now() - new Date(lastReviewedAt).getTime();
      daysSinceReview = Math.floor(diff / 86_400_000);
    }
    
    res.json({
      lastReviewedAt,
      daysSinceReview,
      newTxCount,
      pendingCount,
      unmatchedCount,
      duplicateCount,
      hasUnreviewedItems: pendingCount > 0 || unmatchedCount > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
