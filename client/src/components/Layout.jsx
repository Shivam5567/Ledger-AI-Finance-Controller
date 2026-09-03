import React from 'react';

export default function Layout({ children, isRunning, progress }) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-white/5 bg-navy-950/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              ⚡ Ledger
            </span>
            <span className="text-slate-500 font-medium text-sm border-l border-white/10 pl-3">
              AI Finance Controller
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            {isRunning ? (
              <div className="flex items-center gap-3 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                Processing... {Math.round(progress * 100)}%
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                System Online
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6">
        {children}
      </main>
    </div>
  );
}
