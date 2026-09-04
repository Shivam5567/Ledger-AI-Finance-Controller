import React, { useState, useEffect, useRef } from 'react';
import {
  LogoIcon,
  SearchIcon,
  BellIcon,
  DashboardGridIcon,
  BarChartIcon,
  WalletIcon,
  TableListIcon,
  ChatBubbleIcon,
  ShieldAlertIcon,
  SettingsGearIcon,
} from './Icons';

// ── 1. Top Navigation Bar (Single Clear Navigation Model) ───────────────
export function QuixoticTopNav({
  activeTab,
  onSelectTab,
  exceptionCount = 0,
  onToggleChat,
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Ledger' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'settlements', label: 'Settlements' },
    { id: 'exceptions', label: 'Exceptions', badge: exceptionCount },
    { id: 'reports', label: 'Reports' },
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
      <nav className="hidden xl:flex items-center gap-1 bg-white border border-gray-200/80 rounded-full px-2 py-1 shadow-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'reconciliation' && activeTab === 'reports');
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-gray-100/90 text-gray-900 font-semibold shadow-xs'
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

// ── 2. Floating Left Pill Dock (Navigation-Only Model) ─────────────────
export function QuixoticDock({ activeTab, onSelectTab, onToggleChat, exceptionCount = 0 }) {
  return (
    <aside className="hidden lg:flex flex-col gap-3 py-1 pr-3 select-none w-16">
      {/* Pod 1: Core Financial Operations */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('dashboard')}
          title="Dashboard Overview"
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
          onClick={() => onSelectTab('transactions')}
          title="Ledger Transactions"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TableListIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Ledger</span>
        </button>

        <button
          onClick={() => onSelectTab('reconciliation')}
          title="Reconciliation Center"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'reconciliation' || activeTab === 'reports'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChartIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Reconcile</span>
        </button>

        <button
          onClick={() => onSelectTab('settlements')}
          title="Settlement Funds & Trajectory"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'settlements'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <WalletIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Settlement</span>
        </button>
      </div>

      {/* Pod 2: Exceptions, Intelligence & Forecast */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('exceptions')}
          title="Exceptions & Flagged Items"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'exceptions'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="relative">
            <ShieldAlertIcon className="w-4 h-4" />
            {exceptionCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </div>
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Alerts</span>
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
          <BarChartIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Forecast</span>
        </button>

        <button
          onClick={onToggleChat}
          title="Ledger Copilot Q&A"
          className="w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-[#007A4D] hover:bg-gray-100 transition-all cursor-pointer relative"
        >
          <div className="relative">
            <ChatBubbleIcon className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#007A4D]" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Copilot</span>
        </button>
      </div>

      {/* Pod 3: Settings */}
      <div className="pill-dock p-1.5 flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSelectTab('settings')}
          title="System Settings"
          className={`w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#007A4D] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <SettingsGearIcon className="w-4 h-4" />
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Config</span>
        </button>
      </div>
    </aside>
  );
}

// ── 3. Header Greeting Row (Separate Date Range & Status Filters) ──────
export function QuixoticHeaderRow({
  onRunAgent,
  isRunning,
  txCount = 55,
  onToggleChat,
  dateRange = { startDate: '', endDate: '', label: '01 Jul – 04 Aug 2026' },
  onDateRangeChange,
  statusFilter = 'all',
  onStatusFilterChange,
  lastSyncedAt,
  onRefresh,
  isRefreshing = false,
}) {
  const [dateDropdownOpen, setDateDropdownOpen]     = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [customStart, setCustomStart]               = useState('2026-07-01');
  const [customEnd, setCustomEnd]                   = useState('2026-08-04');
  const [syncLabel, setSyncLabel]                   = useState('Just now');

  const dateDropdownRef   = useRef(null);
  const statusDropdownRef = useRef(null);

  // Auto-updating relative sync time
  useEffect(() => {
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

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    if (dateDropdownOpen || statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateDropdownOpen, statusDropdownOpen]);

  const datePresets = [
    {
      label: '01 Jul – 04 Aug 2026 (All)',
      startDate: '',
      endDate: '',
    },
    {
      label: 'July 2026 (01 – 31 Jul)',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    },
    {
      label: 'August 2026 (01 – 04 Aug)',
      startDate: '2026-08-01',
      endDate: '2026-08-04',
    },
    {
      label: 'Last 14 Days (22 Jul – 04 Aug)',
      startDate: '2026-07-22',
      endDate: '2026-08-04',
    },
  ];

  const statusOptions = [
    { id: 'all', label: 'All Transactions' },
    { id: 'reconciled', label: '✓ Reconciled Only' },
    { id: 'exceptions', label: '⚠ Exceptions Only' },
    { id: 'pending', label: '🔒 Pending Authorization' },
  ];

  const currentStatusLabel = statusOptions.find(o => o.id === statusFilter)?.label || 'All Transactions';

  const handleSelectDatePreset = (p) => {
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: p.startDate,
        endDate: p.endDate,
        label: p.label,
      });
    }
    setDateDropdownOpen(false);
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart} to ${customEnd}`,
      });
    }
    setDateDropdownOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      {/* Greeting Title & Live Status Indicator */}
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
              disabled={isRefreshing}
              title="Refresh dashboard data"
              className="hover:text-emerald-700 transition-colors cursor-pointer text-xs ml-0.5 disabled:opacity-50"
            >
              <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Separate Date Range + Status Filter + Copilot + Action Button */}
      <div className="flex flex-wrap items-center gap-2.5 relative">
        {/* 1. Date Range Capsule */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            onClick={() => setDateDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 shadow-xs transition-all cursor-pointer"
            title="Filter by Date Range"
          >
            <span>📅</span>
            <span className="font-mono text-[11px] sm:text-xs">
              {dateRange?.label || '01 Jul – 04 Aug 2026'}
            </span>
            <span className="text-gray-400 text-[10px] ml-0.5">
              {dateDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Date Picker Popover */}
          {dateDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-40 animate-scale-up text-xs">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                Date Range Presets
              </div>
              <div className="flex flex-col gap-1 mb-3">
                {datePresets.map((p) => {
                  const isSelected = dateRange?.startDate === p.startDate && dateRange?.endDate === p.endDate;
                  return (
                    <button
                      key={p.label}
                      onClick={() => handleSelectDatePreset(p)}
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

              {/* Custom Interval */}
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Custom Interval
                </div>
                <form onSubmit={handleApplyCustomDate} className="flex flex-col gap-2">
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
                    Apply Date Filter
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 2. Separate Transaction Status Capsule */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => setStatusDropdownOpen(prev => !prev)}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 shadow-xs transition-all cursor-pointer"
            title="Filter by Transaction Status"
          >
            <span>🏷️</span>
            <span className="font-mono text-[11px] sm:text-xs">
              {currentStatusLabel}
            </span>
            <span className="text-gray-400 text-[10px] ml-0.5">
              {statusDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Status Dropdown Popover */}
          {statusDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-40 animate-scale-up text-xs">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5 font-mono">
                Transaction Status
              </div>
              <div className="flex flex-col gap-0.5">
                {statusOptions.map((opt) => {
                  const isSelected = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (onStatusFilterChange) onStatusFilterChange(opt.id);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-[#007A4D] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Settlement / Ledger Copilot Header Button */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 rounded-full px-3.5 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
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
              <span>Reconciling…</span>
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
