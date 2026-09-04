import React from 'react';

export default function Sidebar({ activeTab, onSelectTab, exceptionCount = 0, transactionCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions', count: transactionCount > 0 ? transactionCount : null },
    { id: 'exceptions', label: 'Exceptions', badge: exceptionCount > 0 ? exceptionCount : null },
    { id: 'forecast', label: 'Forecast' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="w-[220px] shrink-0 bg-[#0D0D0F] border-r border-[#2A2A2E] flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Top section */}
      <div>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5] font-bold text-lg tracking-tight flex items-center gap-1.5">
              <span className="text-[#4F6EF7]">⚡</span> Ledger
            </span>
          </div>
          <p className="text-[12px] text-[#8A8A8E] mt-0.5 font-medium tracking-wide">
            AI Finance Controller
          </p>
        </div>

        {/* Navigation list */}
        <nav className="p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[14px] transition-all relative text-left cursor-pointer ${
                  isActive
                    ? 'text-[#F5F5F5] font-semibold bg-[#141416]'
                    : 'text-[#8A8A8E] hover:text-[#F5F5F5] hover:bg-[#141416]/50 font-normal'
                }`}
              >
                {/* Active left indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#4F6EF7] rounded-r" />
                )}
                <span>{item.label}</span>

                {/* Optional counts/badges */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#2D1515] text-[#EF4444] border border-[#3D2020]">
                    {item.badge}
                  </span>
                )}
                {item.count !== null && item.count !== undefined && !item.badge && (
                  <span className="text-[11px] font-mono text-[#505055]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom status */}
      <div className="p-4 border-t border-[#2A2A2E]">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-[#F5F5F5]">System Online</span>
            <span className="text-[10px] text-[#8A8A8E]">Groq Llama / OSS Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
