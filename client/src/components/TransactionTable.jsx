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
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export default function TransactionTable({ transactions, onApprove, onDismiss }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id, hasFlags) => {
    if (!hasFlags) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedTx = [...(transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-lg font-semibold text-slate-200">Transactions</h3>
      </div>
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
            {sortedTx.map((tx, idx) => {
              const flags = Array.isArray(tx.flags) ? tx.flags : (typeof tx.flags === 'string' ? JSON.parse(tx.flags || '[]') : []);
              const isFlagged = flags.length > 0;
              const isExpanded = expandedId === tx.id;
              const amountColor = tx.type === 'income' ? 'text-emerald-400' 
                               : tx.type === 'refund' ? 'text-amber-400' 
                               : 'text-red-400';
              
              const catClass = tx.category ? catColors[tx.category.toLowerCase()] || catColors.other : null;

              return (
                <React.Fragment key={tx.id}>
                  <tr 
                    onClick={() => toggleExpand(tx.id, isFlagged)}
                    className={`border-b border-white/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'} ${isFlagged ? 'cursor-pointer hover:bg-white/5' : ''}`}
                  >
                    <td className="p-4 text-sm whitespace-nowrap text-slate-300">{tx.date}</td>
                    <td className="p-4 text-sm text-slate-200">{tx.description}</td>
                    <td className={`p-4 text-sm font-medium ${amountColor}`}>
                      {tx.type === 'expense' ? '-' : tx.type === 'refund' ? '+' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm">
                      {tx.category ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${catClass}`}>
                          {tx.category}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {flags.map((f, i) => <FlagBadge key={i} flag={f} />)}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {tx.action_status === 'approved' && <span className="text-emerald-400 text-xs font-medium">✅ Resolved</span>}
                      {tx.action_status === 'dismissed' && <span className="text-slate-500 text-xs font-medium">Dismissed</span>}
                      {tx.action_status === 'pending' && <span className="text-amber-400 text-xs font-medium">⚡ Pending</span>}
                      {(!tx.action_status || tx.action_status === 'none') && isFlagged && <span className="text-blue-400 text-xs font-medium">Action Req.</span>}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-navy-800/50">
                      <td colSpan="6" className="p-0">
                        <div className="animate-slide-down">
                          <ActionPanel 
                            transaction={tx} 
                            onApprove={() => onApprove(tx.id)}
                            onDismiss={() => onDismiss(tx.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {sortedTx.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
