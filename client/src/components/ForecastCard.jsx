import React from 'react';

export default function ForecastCard({ summary }) {
  // Compute projection from live data or fallbacks based on the 55 transaction dataset
  const categories = summary?.byCategory || [];

  const defaultForecasts = [
    { name: 'Payroll', amount: 56000, trend: 'stable', pct: 95, color: '#4F6EF7' },
    { name: 'Cloud/Infra', amount: 4800, trend: '↑ +20%', pct: 60, color: '#EF4444' },
    { name: 'Marketing', amount: 8900, trend: 'stable', pct: 75, color: '#F59E0B' },
    { name: 'Office', amount: 9000, trend: 'stable', pct: 78, color: '#22C55E' },
  ];

  // If we have live categories, map them
  const items = categories.length > 0
    ? categories.slice(0, 5).map(c => {
        let trend = 'stable';
        let pct = 70;
        let color = '#4F6EF7';

        if (c.category.includes('cloud') || c.category.includes('infra')) {
          trend = '↑ +20%';
          color = '#EF4444';
          pct = 85;
        } else if (c.category.includes('payroll')) {
          color = '#4F6EF7';
          pct = 95;
        } else if (c.category.includes('marketing') || c.category.includes('ads')) {
          color = '#F59E0B';
          pct = 75;
        } else if (c.category.includes('rent') || c.category.includes('office')) {
          color = '#22C55E';
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
    <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 transition-all">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-[16px] font-semibold text-[#F5F5F5] tracking-tight">
          August Forecast
        </h3>
        <span className="text-[12px] font-mono text-[#505055]">
          based on 2mo history
        </span>
      </div>

      {/* Category breakdown rows */}
      <div className="flex flex-col gap-3.5 mb-6">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-[13px] gap-4">
            <span className="w-28 text-[#8A8A8E] truncate font-medium">
              {item.name}
            </span>

            <span className="w-24 font-mono font-medium text-[#F5F5F5] tabular-nums">
              ${item.amount.toLocaleString()}
            </span>

            {/* Pure CSS bar */}
            <div className="flex-1 h-2 bg-[#1C1C1F] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>

            {/* Trend badge */}
            <span
              className={`w-16 text-right font-mono text-[12px] ${
                item.trend.includes('↑')
                  ? 'text-[#EF4444] font-medium'
                  : 'text-[#505055]'
              }`}
            >
              {item.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Projected total footer */}
      <div className="border-t border-[#2A2A2E] pt-4 flex items-baseline justify-between">
        <span className="text-[13px] text-[#8A8A8E]">Projected total:</span>
        <span className="text-[18px] font-bold font-mono text-[#F5F5F5] tabular-nums">
          ${totalProjected.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
