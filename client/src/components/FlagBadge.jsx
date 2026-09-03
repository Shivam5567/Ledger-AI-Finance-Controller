import React from 'react';

const flagConfig = {
  anomaly: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: '⚠️ Anomaly',
    confidenceColor: { high: 'text-red-300', medium: 'text-red-400/70', low: 'text-red-400/50' },
  },
  duplicate: {
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    label: '🔄 Duplicate',
    confidenceColor: { high: 'text-orange-300', medium: 'text-orange-400/70', low: 'text-orange-400/50' },
  },
  unmatched_invoice: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    label: '📋 No Invoice',
    confidenceColor: { high: 'text-yellow-300', medium: 'text-yellow-400/70', low: 'text-yellow-400/50' },
  },
  duplicate_invoice: {
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    label: '📋 Dup Invoice',
    confidenceColor: { high: 'text-orange-300', medium: 'text-orange-400/70', low: 'text-orange-400/50' },
  },
};

const confidenceLabel = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
};

// Infer confidence from flag type if not explicitly provided
function inferConfidence(flag) {
  if (flag === 'duplicate' || flag === 'duplicate_invoice' || flag === 'unmatched_invoice') return 'high';
  if (flag === 'anomaly') return 'medium';
  return 'low';
}

export default function FlagBadge({ flag, confidence }) {
  const config = flagConfig[flag] || {
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    label: flag,
    confidenceColor: { high: 'text-slate-300', medium: 'text-slate-400', low: 'text-slate-500' },
  };

  const conf = confidence || inferConfidence(flag);
  const confColor = config.confidenceColor[conf] || 'text-slate-400/60';
  const confText  = confidenceLabel[conf] || conf;

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all hover:shadow-[0_0_8px_rgba(255,255,255,0.1)] ${config.color}`}
      >
        {config.label}
      </span>
      {conf && (
        <span className={`text-[10px] font-medium px-1 ${confColor}`}>
          · {confText}
        </span>
      )}
    </div>
  );
}
