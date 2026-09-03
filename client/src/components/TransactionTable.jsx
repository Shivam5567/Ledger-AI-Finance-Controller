import React, { useState } from 'react';
import FlagBadge from './FlagBadge';
import ActionPanel from './ActionPanel';

const catColors = {
  rent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  payroll: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'cloud/infra': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  software: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  marketing: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  client_income: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  refund: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function TxRow({ tx, idx, isExpanded, onToggle, onApprove, onDismiss, onReset }) {
  const flags = Array.isArray(tx.flags)
    ? tx.flags
    : (typeof tx.flags === 'string' ? JSON.parse(tx.flags || '[]') : []);
  const isFlagged  = flags.length > 0;
  const amountColor = tx.type === 'income' ? 'text-emerald-400'
                    : tx.type === 'refund'  ? 'text-amber-400'
                    : 'text-red-400';
  const catClass = tx.category
    ? catColors[tx.category.toLowerCase()] || catColors.other
    : null;

  const statusDisplay = () => {
    if (tx.action_status === 'approved')  return <span className="text-emerald-400 text-xs font-medium">✅ Resolved</span>;
    if (tx.action_status === 'dismissed') return <span className="text-slate-500 text-xs font-medium">🚫 Dismissed</span>;
    if (tx.action_status === 'pending')   return <span className="text-amber-400 text-xs font-medium">⚡ Pending</span>;
    if (isFlagged)                        return <span className="text-blue-400 text-xs font-medium">Action Req.</span>;
    return null;
  };

  return (
    <React.Fragment>
      <tr
        onClick={() => isFlagged && onToggle(tx.id)}
        className={`border-b border-white/5 transition-colors
          ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
          ${isFlagged ? 'cursor-pointer hover:bg-white/5' : ''}
          ${isExpanded ? 'bg-blue-900/10' : ''}`}
      >
        <td className="p-4 text-sm whitespace-nowrap text-slate-300">{tx.date}</td>
        <td className="p-4 text-sm text-slate-200">{tx.description}</td>
        <td className={`p-4 text-sm font-medium ${amountColor}`}>
          {tx.type === 'expense' ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        <td className="p-4 text-sm">
          {tx.category ? (
            <span className={`px-2.5 py-1 rounded-full text-xs border ${catClass}`}>{tx.category}</span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
        <td className="p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {flags.map((f, i) => (
              <FlagBadge key={i} flag={f} confidence={tx.confidence} />
            ))}
          </div>
        </td>
        <td className="p-4 text-sm">{statusDisplay()}</td>
      </tr>

      {isExpanded && (
        <tr className="bg-navy-800/50">
          <td colSpan="6" className="p-0">
            <div className="animate-slide-down">
              <ActionPanel
                transaction={tx}
                onApprove={() => onApprove(tx.id)}
                onDismiss={() => onDismiss(tx.id)}
                onReset={() => onReset(tx.id)}
              />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

export default function TransactionTable({ transactions, onApprove, onDismiss, onReset }) {
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'resolved' | 'all'

  const allTx   = [...(transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const pending  = allTx.filter(t => {
    const flags = Array.isArray(t.flags) ? t.flags : JSON.parse(t.flags || '[]');
    const isFlagged = flags.length > 0;
    return isFlagged && t.action_status !== 'approved' && t.action_status !== 'dismissed';
  });
  const resolved = allTx.filter(t => t.action_status === 'approved' || t.action_status === 'dismissed');

  const displayTx = activeTab === 'pending'  ? pending
                  : activeTab === 'resolved' ? resolved
                  : allTx;

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const tabs = [
    { key: 'pending',  label: 'Pending',  count: pending.length,  activeClass: 'border-amber-400 text-amber-300' },
    { key: 'resolved', label: 'Resolved', count: resolved.length, activeClass: 'border-emerald-400 text-emerald-300' },
    { key: 'all',      label: 'All',      count: allTx.length,    activeClass: 'border-blue-400 text-blue-300' },
  ];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with tabs */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-200 mr-auto">Transactions</h3>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5
                ${activeTab === tab.key
                  ? `bg-white/10 border ${tab.activeClass}`
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 hidden sm:block">
          {activeTab === 'pending' ? 'Click to view AI drafts' : 'Action history'}
        </span>
      </div>

      {/* Resolved empty state */}
      {activeTab === 'resolved' && resolved.length === 0 && (
        <div className="py-14 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-slate-400 text-sm mt-3">No resolved items yet.</p>
          <p className="text-slate-500 text-xs mt-1">Approve or dismiss flagged transactions to see them here.</p>
        </div>
      )}

      {/* Resolved timeline view */}
      {activeTab === 'resolved' && resolved.length > 0 && (
        <div className="divide-y divide-white/5">
          {resolved.map(tx => {
            const flags = Array.isArray(tx.flags) ? tx.flags : JSON.parse(tx.flags || '[]');
            const isApproved = tx.action_status === 'approved';
            return (
              <div key={tx.id} className="px-6 py-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm
                  ${isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {isApproved ? '✅' : '🚫'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} · {tx.date}
                    <span className={`ml-2 font-medium ${isApproved ? 'text-emerald-400' : 'text-slate-500'}`}>
                      · {isApproved ? 'Approved' : 'Dismissed'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {flags.slice(0, 2).map((f, i) => <FlagBadge key={i} flag={f} confidence={tx.confidence} />)}
                </div>
                <button
                  onClick={() => onReset(tx.id)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium flex-shrink-0"
                >
                  Undo
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard table view (Pending + All tabs) */}
      {activeTab !== 'resolved' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-sm border-b border-white/5">
                <th className="p-4 font-medium whitespace-nowrap">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Flags</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayTx.map((tx, idx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  idx={idx}
                  isExpanded={expandedId === tx.id}
                  onToggle={toggleExpand}
                  onApprove={onApprove}
                  onDismiss={onDismiss}
                  onReset={onReset}
                />
              ))}
              {displayTx.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <span className="text-3xl block mb-3">🎉</span>
                    <p className="text-slate-400 text-sm">No pending items — all clear!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
