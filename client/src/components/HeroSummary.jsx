import React from 'react';

export default function HeroSummary({ summary, transactions = [] }) {
  if (!summary) return null;

  const fmt = (num) => {
    const val = Math.abs(num || 0);
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const net = summary.net || 0;
  const isPositive = net >= 0;
  const netFormatted = `${isPositive ? '+' : '-'}$${fmt(net)}`;
  const flagCount = summary.flaggedCount || transactions.filter(t => t.flags && t.flags.length > 0).length;

  return (
    <div className="w-full bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 transition-all">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[14px] font-medium text-[#8A8A8E]">Net Position</span>
        <span className="text-[12px] text-[#505055] font-medium">this period</span>
      </div>

      {/* Large 32px display number */}
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className={`text-[32px] font-bold tracking-tight tabular-nums font-mono ${
            isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
          }`}
        >
          {netFormatted}
        </span>
      </div>

      {/* One line of supporting metadata */}
      <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#8A8A8E]">
        <span className="text-[#F5F5F5] font-mono tabular-nums font-medium">
          +${fmt(summary.totalIncome)}
        </span>{' '}
        income
        <span className="text-[#505055]">·</span>
        <span className="text-[#F5F5F5] font-mono tabular-nums font-medium">
          -${fmt(summary.totalExpenses)}
        </span>{' '}
        expenses
        <span className="text-[#505055]">·</span>
        <span className={`${flagCount > 0 ? 'text-[#F59E0B]' : 'text-[#8A8A8E]'} font-medium`}>
          {flagCount} {flagCount === 1 ? 'flag' : 'flags'}
        </span>
      </div>
    </div>
  );
}
