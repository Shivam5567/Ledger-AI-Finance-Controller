import React from 'react';
import {
  LogoIcon,
  SearchIcon,
  BellIcon,
  DashboardGridIcon,
  BarChartIcon,
  WalletIcon,
  TableListIcon,
  CreditCardIcon,
  ChatBubbleIcon,
  ShieldAlertIcon,
  SettingsGearIcon,
  ReloadIcon,
} from './Icons';

// ── 1. Top Navigation Bar (matching reference image) ───────────────────
export function QuixoticTopNav({
  activeTab,
  onSelectTab,
  exceptionCount = 0,
  onToggleChat,
  onReload,
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reports' },
    { id: 'transactions', label: 'Ledger' },
    { id: 'exceptions', label: 'Exceptions', badge: exceptionCount },
    { id: 'forecast', label: 'Forecast' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="w-full flex items-center justify-between py-4 px-2 sm:px-6">
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
        <LogoIcon className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-gray-900 flex items-center">
          Ledger <span className="text-[#007A4D] ml-1">AI</span>
        </span>
      </div>

      {/* Center: Rounded Pill Navigation Menu */}
      <nav className="hidden md:flex items-center gap-1 bg-white border border-gray-200/80 rounded-full px-2 py-1 shadow-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-gray-100/80 text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Ledger Copilot Button, Search, Notification Bell, User Avatar */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <span>💬</span>
          <span className="hidden sm:inline">Ledger Copilot</span>
        </button>

        <button
          onClick={onToggleChat}
          title="Search / Ledger Copilot"
          className="w-9 h-9 rounded-full bg-white border border-gray-200/80 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-xs cursor-pointer"
        >
          <SearchIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTab('exceptions')}
          title="Notifications & Exceptions"
          className="w-9 h-9 rounded-full bg-white border border-gray-200/80 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-xs relative cursor-pointer"
        >
          <BellIcon className="w-4 h-4" />
          {exceptionCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
          )}
        </button>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={() => onSelectTab('settings')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-xs">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
              LA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── 2. Floating Left Pill Dock (With Icon Labels) ──────────────────────
export function QuixoticDock({ activeTab, onSelectTab, onToggleChat, onReload, isReloading }) {
  return (
    <aside className="hidden lg:flex flex-col gap-3 py-1 pr-3 select-none w-16">
      {/* Pod 1: Primary Navigation */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('dashboard')}
          title="Dashboard"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <DashboardGridIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          title="Reconciliation Reports"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChartIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Reports</span>
        </button>

        <button
          onClick={() => onSelectTab('forecast')}
          title="Spend Forecast & Wallets"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'forecast'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <WalletIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Forecast</span>
        </button>

        <button
          onClick={() => onSelectTab('transactions')}
          title="Transaction Ledger"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TableListIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Ledger</span>
        </button>
      </div>

      {/* Pod 2: Tools & Communication */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('transactions')}
          title="Cards & Payments"
          className="w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
        >
          <CreditCardIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Cards</span>
        </button>

        <button
          onClick={onToggleChat}
          title="Ledger Copilot"
          className="w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-[#007A4D] hover:bg-gray-100 transition-all cursor-pointer relative"
        >
          <div className="relative">
            <ChatBubbleIcon className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#007A4D]" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Copilot</span>
        </button>

        <button
          onClick={() => onSelectTab('exceptions')}
          title="Exceptions & Flagged Items"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'exceptions'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldAlertIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Alerts</span>
        </button>
      </div>

      {/* Pod 3: Settings & Actions */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('settings')}
          title="Settings"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <SettingsGearIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Config</span>
        </button>

        <button
          onClick={onReload}
          disabled={isReloading}
          title="Reload Transactions CSV"
          className="w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-40"
        >
          <ReloadIcon className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Reload</span>
        </button>
      </div>
    </aside>
  );
}

// ── 3. Header Greeting Row (Interactive Date Range + Live Sync + CTA) ──
export function QuixoticHeaderRow({
  onRunAgent,
  isRunning,
  txCount = 55,
  onToggleChat,
  dateRange = { startDate: '', endDate: '', label: 'All Transactions (01 Jul - 04 Aug, 2026)' },
  onDateRangeChange,
  lastSyncedAt,
  onRefresh,
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [customStart, setCustomStart]   = React.useState('2026-07-01');
  const [customEnd, setCustomEnd]       = React.useState('2026-08-04');
  const [syncLabel, setSyncLabel]       = React.useState('Just now');
  const dropdownRef                     = React.useRef(null);

  // Auto-updating relative sync time
  React.useEffect(() => {
    const updateSyncTime = () => {
      if (!lastSyncedAt) {
        setSyncLabel('Just now');
        return;
      }
      const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) setSyncLabel('Just now');
      else if (diffSec < 60) setSyncLabel(`${diffSec}s ago`);
      else setSyncLabel(`${Math.floor(diffSec / 60)}m ago`);
    };

    updateSyncTime();
    const interval = setInterval(updateSyncTime, 5000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Click outside to close date dropdown
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const presets = [
    {
      label: 'All Transactions (01 Jul - 04 Aug, 2026)',
      startDate: '',
      endDate: '',
    },
    {
      label: 'July 2026 (01 Jul - 31 Jul, 2026)',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    },
    {
      label: 'August 2026 (01 Aug - 04 Aug, 2026)',
      startDate: '2026-08-01',
      endDate: '2026-08-04',
    },
    {
      label: 'Last 14 Days (22 Jul - 04 Aug, 2026)',
      startDate: '2026-07-22',
      endDate: '2026-08-04',
    },
  ];

  const handleSelectPreset = (p) => {
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: p.startDate,
        endDate: p.endDate,
        label: p.label,
      });
    }
    setDropdownOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart} to ${customEnd}`,
      });
    }
    setDropdownOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      {/* Greeting Title & Live Sync Status */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Welcome Back, <span className="font-semibold text-gray-800">Controller</span>
        </h1>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span>·</span>
          <span>Last synced {syncLabel}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh live metrics"
              className="hover:text-emerald-700 transition-colors cursor-pointer text-[11px]"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Interactive Date Range selector + Copilot + Action Button */}
      <div className="flex flex-wrap items-center gap-3 relative">
        {/* Date capsule with interactive dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full px-4 py-2 text-xs font-medium text-gray-700 shadow-xs transition-all cursor-pointer"
            title="Filter dashboard by date range"
          >
            <span>📅</span>
            <span className="font-mono text-[11px] sm:text-xs">
              {dateRange?.label || '01 Jul, 2026 - 04 Aug, 2026'}
            </span>
            <span className="text-gray-400 text-[10px] ml-0.5">
              {dropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Date Picker Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-40 animate-scale-up text-xs">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                Date Range Presets
              </div>
              <div className="flex flex-col gap-1 mb-4">
                {presets.map((p) => {
                  const isSelected = dateRange?.startDate === p.startDate && dateRange?.endDate === p.endDate;
                  return (
                    <button
                      key={p.label}
                      onClick={() => handleSelectPreset(p)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-[#007A4D] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Custom Range Picker */}
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Custom Interval
                </div>
                <form onSubmit={handleApplyCustom} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-1/2 p-1.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-800"
                    />
                    <span className="text-gray-400 font-mono">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-1/2 p-1.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#007A4D] hover:bg-[#00603C] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Apply Filter
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Settlement / Ledger Copilot Header Button */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span>💬</span>
            <span>Ledger Copilot</span>
          </button>
        )}

        {/* Action Button: Run AI Reconciliation */}
        <button
          onClick={onRunAgent}
          disabled={isRunning}
          className="flex items-center gap-2 bg-[#007A4D] hover:bg-[#00603C] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Reconciling Ledger…</span>
            </>
          ) : (
            <>
              <span className="text-white font-bold">⚡</span>
              <span>Run AI Reconciliation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
