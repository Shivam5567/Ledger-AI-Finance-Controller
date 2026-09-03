import React from 'react';

export default function RunAgentButton({ onRun, isRunning, stage, progress }) {
  if (isRunning) {
    return (
      <div className="flex flex-col items-end gap-2 w-64 animate-fade-in">
        <div className="text-sm font-medium text-blue-400 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          {stage || 'Processing...'}
        </div>
        <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 ease-out relative"
            style={{ width: `${Math.max(5, progress * 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={onRun}
      className="glass-button relative group px-6 py-2.5 rounded-xl font-medium text-sm overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="relative flex items-center gap-2 text-slate-200">
        🚀 Run AI Agent
      </span>
    </button>
  );
}
