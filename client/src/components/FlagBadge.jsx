import React from 'react';

const flagConfig = {
  anomaly: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '⚠️ Anomaly' },
  duplicate: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: '🔄 Duplicate' },
  unmatched_invoice: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '📋 No Invoice' },
  duplicate_invoice: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: '📋 Dup Invoice' }
};

export default function FlagBadge({ flag }) {
  const config = flagConfig[flag] || { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: flag };
  
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all hover:shadow-[0_0_8px_rgba(255,255,255,0.1)] ${config.color}`}>
      {config.label}
    </span>
  );
}
