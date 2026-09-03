import React, { useState, useEffect } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function CountUp({ target, duration = 1200 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

export default function HeroMetrics({ agentResult, transactions }) {
  if (!agentResult) return null;

  const { issueValue = 0, pendingCount = 0, duplicates = 0, anomalies = 0, unmatched = 0 } = agentResult;

  // Compute issue value from live transactions if agentResult doesn't have it
  const computedIssueValue = issueValue || (transactions || [])
    .filter(t => t.flags && t.flags.length > 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const subItems = [
    { icon: '🔄', label: 'Duplicate payments',   count: duplicates,  color: 'text-orange-400' },
    { icon: '⚠️', label: 'Spend anomalies',       count: anomalies,   color: 'text-red-400'    },
    { icon: '📋', label: 'Unmatched invoices',    count: unmatched,   color: 'text-yellow-400' },
  ];

  return (
    <div
      className="glass-card overflow-hidden border border-blue-500/20"
      style={{ animation: 'heroReveal 0.6s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0 }}
    >
      {/* Gradient bar at top */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

      <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
        {/* Main headline */}
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              ⚡ {fmt(computedIssueValue)}
            </span>
            <span className="text-lg md:text-xl font-semibold text-slate-300">
              in issues found
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {pendingCount} action{pendingCount !== 1 ? 's' : ''} pending your approval
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-16 bg-white/10" />

        {/* Sub-numbers */}
        <div className="flex gap-6 md:gap-8">
          {subItems.map(({ icon, label, count, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`text-2xl font-black ${color}`}>
                <CountUp target={count} />
              </span>
              <span className="text-xs text-slate-400 text-center whitespace-nowrap">{icon} {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
