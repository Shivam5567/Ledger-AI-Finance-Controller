import React, { useEffect, useState } from 'react';

export default function ProactiveBanner({ onReviewNow }) {
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/proactive')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.hasUnreviewedItems) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data || dismissed) return null;

  const { daysSinceReview, pendingCount, duplicateCount, unmatchedCount, newTxCount } = data;

  const sinceText = daysSinceReview === null
    ? 'No previous review found'
    : daysSinceReview === 0
    ? 'Last reviewed today'
    : daysSinceReview === 1
    ? 'Last reviewed 1 day ago'
    : `Last reviewed ${daysSinceReview} days ago`;

  return (
    <div
      className="glass-card p-4 border border-amber-500/20 bg-amber-900/10 animate-slide-down"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">📋</span>
          <div>
            <p className="text-sm font-semibold text-amber-200">
              {sinceText} — items need your attention
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
              {pendingCount > 0   && <span>• <strong className="text-amber-400">{pendingCount}</strong> pending actions</span>}
              {duplicateCount > 0 && <span>• <strong className="text-orange-400">{duplicateCount}</strong> duplicate{duplicateCount !== 1 ? 's' : ''} detected</span>}
              {unmatchedCount > 0 && <span>• <strong className="text-yellow-400">{unmatchedCount}</strong> unmatched invoice{unmatchedCount !== 1 ? 's' : ''}</span>}
              {newTxCount > 0     && <span>• <strong className="text-blue-400">{newTxCount}</strong> new transaction{newTxCount !== 1 ? 's' : ''} added</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onReviewNow}
            className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-sm font-medium transition-all hover:scale-105"
          >
            Review Now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-500 hover:text-slate-300 text-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
