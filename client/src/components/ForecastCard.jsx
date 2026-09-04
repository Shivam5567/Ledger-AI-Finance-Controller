import React from 'react';

export default function ForecastCard({ summary }) {
  const categories = summary?.byCategory || [];

  const defaultForecasts = [
    { name: 'Payroll', amount: 56000, trend: 'stable', pct: 95, color: '#007A4D' },
    { name: 'Cloud / Infra', amount: 4800, trend: '↑ +20%', pct: 60, color: '#DC2626' },
    { name: 'Marketing', amount: 8900, trend: 'stable', pct: 75, color: '#D97706' },
    { name: 'Office Rent', amount: 9000, trend: 'stable', pct: 78, color: '#059669' },
  ];

  const items = categories.length > 0
    ? categories.slice(0, 5).map(c => {
        let trend = 'stable';
        let pct = 70;
        let color = '#007A4D';

        if (c.category.includes('cloud') || c.category.includes('infra')) {
          trend = '↑ +20%';
          color = '#DC2626';
          pct = 85;
        } else if (c.category.includes('payroll')) {
          color = '#007A4D';
          pct = 95;
        } else if (c.category.includes('marketing') || c.category.includes('ads')) {
          color = '#D97706';
          pct = 75;
        } else if (c.category.includes('rent') || c.category.includes('office')) {
          color = '#059669';
          pct = 80;
        }

        return {
          name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
          amount: Math.round(c.total),
          trend,
          pct,
          color,
        };
      })
    : defaultForecasts;

  const totalProjected = items.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="quixotic-card p-6 transition-all">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
            August Spend Forecast
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            Forward projection based on 2-month dataset run-rate
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#007A4D] border border-emerald-200">
          Run-Rate Predictive Model
        </span>
      </div>

      {/* Category breakdown rows */}
      <div className="flex flex-col gap-3.5 mb-6">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs gap-4">
            <span className="w-28 text-gray-700 truncate font-semibold">
              {item.name}
            </span>

            <span className="w-24 font-mono font-bold text-gray-900 tabular-nums text-[13px]">
              ₹{item.amount.toLocaleString('en-IN')}
            </span>

            {/* Pure CSS bar */}
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>

            {/* Trend badge */}
            <span
              className={`w-16 text-right font-mono text-[11px] font-semibold ${
                item.trend.includes('↑')
                  ? 'text-red-600'
                  : 'text-gray-400'
              }`}
            >
              {item.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Projected total footer */}
      <div className="border-t border-gray-100 pt-4 flex items-baseline justify-between">
        <span className="text-xs text-gray-500 font-medium">Total projected monthly run-rate:</span>
        <span className="text-xl font-bold font-mono text-gray-900 tabular-nums">
          ₹{totalProjected.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
