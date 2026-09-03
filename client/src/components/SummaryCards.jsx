import React from 'react';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(summary.totalIncome),
      emoji: "💰",
      colorClass: "text-emerald-400",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary.totalExpenses),
      emoji: "📉",
      colorClass: "text-red-400",
      borderHover: "hover:border-red-500/50"
    },
    {
      title: "Net Position",
      value: formatCurrency(summary.net),
      emoji: "📊",
      colorClass: summary.net >= 0 ? "text-blue-400" : "text-red-400",
      borderHover: summary.net >= 0 ? "hover:border-blue-500/50" : "hover:border-red-500/50"
    },
    {
      title: "Flagged Items",
      value: summary.flaggedCount,
      emoji: "⚠️",
      colorClass: "text-amber-400",
      borderHover: "hover:border-amber-500/50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className={`glass-card p-6 flex flex-col gap-2 ${card.borderHover}`}>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <span>{card.emoji}</span>
            {card.title}
          </div>
          <div className={`text-3xl font-bold ${card.colorClass}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
