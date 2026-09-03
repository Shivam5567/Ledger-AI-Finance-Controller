import React, { useEffect, useState } from 'react';

const categoryColors = {
  rent: '#3b82f6',        // blue-500
  payroll: '#a855f7',     // purple-500
  'cloud/infra': '#06b6d4', // cyan-500
  software: '#6366f1',    // indigo-500
  marketing: '#ec4899',   // pink-500
  client_income: '#10b981', // emerald-500
  refund: '#f59e0b',      // amber-500
  other: '#64748b'        // slate-500
};

export default function SpendChart({ byCategory }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setMounted(true), 100);
  }, []);

  if (!byCategory || byCategory.length === 0) return null;

  // Find max for scaling
  const maxAmount = Math.max(...byCategory.map(c => c.total));

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-200">Spend by Category</h3>
      <div className="flex flex-col gap-3">
        {byCategory.map((cat, idx) => {
          const percentage = maxAmount > 0 ? (cat.total / maxAmount) * 100 : 0;
          const color = categoryColors[cat.category.toLowerCase()] || categoryColors.other;
          
          return (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-slate-400 truncate text-right">
                {cat.category}
              </div>
              <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: mounted ? `${percentage}%` : '0%', 
                    backgroundColor: color,
                    backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 100%)`
                  }}
                />
              </div>
              <div className="w-24 text-sm font-semibold text-slate-300 text-right">
                ${cat.total.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
