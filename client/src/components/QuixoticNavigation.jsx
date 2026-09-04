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
  SparklesIcon,
  LightningBoltIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckIcon,
  TagIcon,
  CreditCardIcon,
  CalendarIcon,
} from './Icons';

// ── 1. Top Navigation Bar (Single Responsive Navigation Model) ──────────
export function QuixoticTopNav({
  activeTab,
  onSelectTab,
  exceptionCount = 0,
  onToggleChat,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', Icon: DashboardGridIcon },
    { id: 'transactions', label: 'Ledger', Icon: TableListIcon },
    { id: 'reconciliation', label: 'Reconciliation', Icon: BarChartIcon },
    { id: 'settlements', label: 'Settlements', Icon: WalletIcon },
    { id: 'exceptions', label: 'Exceptions', Icon: ShieldAlertIcon, badge: exceptionCount },
    { id: 'reports', label: 'Reports', Icon: BarChartIcon },
    { id: 'forecast', label: 'Forecast', Icon: CreditCardIcon },
    { id: 'settings', label: 'Settings', Icon: SettingsGearIcon },
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="w-full flex items-center justify-between py-4 px-2 sm:px-4 md:px-6">
        {/* Left: Hamburger (mobile) & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onSelectTab('dashboard')}
          >
            <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 flex items-center">
              Ledger <span className="text-[#007A4D] ml-1">AI</span>
            </span>
          </div>
        </div>

        {/* Center: Rounded Pill Navigation Menu (Tablet & Desktop: >= 768px) */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-white border border-gray-200/80 rounded-full px-1.5 lg:px-2 py-1 shadow-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'reconciliation' && activeTab === 'reports');
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-2.5 lg:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
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

        {/* Right: Single Primary Copilot Button, Notifications, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Primary Ledger Copilot Entry Point */}
          <button
            onClick={onToggleChat}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-950 hover:bg-black text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer border border-emerald-500/40 group hover:border-emerald-400"
            title="Ask Ledger Copilot — AI Financial Intelligence"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="inline font-semibold tracking-tight">Ask Copilot</span>
          </button>

          <button
            onClick={() => onSelectTab('exceptions')}
            title="Notifications & Exceptions"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200/80 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors shadow-xs relative cursor-pointer"
          >
            <BellIcon className="w-4 h-4" />
            {exceptionCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </button>

          {/* User profile avatar */}
          <div
            className="flex items-center gap-2 pl-0.5 cursor-pointer"
            onClick={() => onSelectTab('settings')}
            title="Profile & Settings"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-xs">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                LA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-out Drawer (< 768px) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slide-in-left">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2" onClick={() => handleTabClick('dashboard')}>
                  <LogoIcon className="w-7 h-7" />
                  <span className="text-lg font-bold text-gray-900">
                    Ledger <span className="text-[#007A4D]">AI</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Items (8 Items) */}
              <div className="flex flex-col gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id || (tab.id === 'reconciliation' && activeTab === 'reports');
                  const Icon = tab.Icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-[#007A4D] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-[#007A4D]' : 'text-gray-500'}`} />}
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Copilot */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onToggleChat) onToggleChat();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer border border-emerald-500/30"
              >
                <SparklesIcon className="w-4 h-4 text-emerald-400" />
                <span>Ask Ledger Copilot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── 2. Floating Left Pill Dock (Deprecated - No-op for backward compatibility) ─
export function QuixoticDock() {
  return null;
}

// ── 3. Header Greeting Row (Separate Date Range & Status Filters) ──────
export function QuixoticHeaderRow({
  onRunAgent,
  isRunning,
  aiStatus = 'NOT_RUN',
  txCount = 55,
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
    { id: 'reconciled', label: 'Reconciled Only' },
    { id: 'exceptions', label: 'Exceptions Only' },
    { id: 'pending', label: 'Pending Authorization' },
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
              <RefreshCwIcon className={`w-3 h-3 inline ${isRefreshing ? 'animate-spin' : ''}`} />
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
            <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
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
                      {isSelected && <CheckIcon className="w-3.5 h-3.5 text-[#007A4D]" />}
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
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 shadow-xs transition-all cursor-pointer"
            title="Filter by Transaction Status"
          >
            <TagIcon className="w-3.5 h-3.5 text-gray-500" />
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
                      {isSelected && <CheckIcon className="w-3.5 h-3.5 text-[#007A4D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: State-driven AI Reconciliation */}
        <button
          onClick={onRunAgent}
          disabled={isRunning}
          className="flex items-center gap-2 bg-[#007A4D] hover:bg-[#00603C] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 group"
          title={aiStatus === 'COMPLETED' ? "Re-run reconciliation analysis on current dataset" : "Execute AI reconciliation pipeline"}
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Reconciling Ledger…</span>
            </>
          ) : aiStatus === 'COMPLETED' ? (
            <>
              <RefreshCwIcon className="w-3.5 h-3.5 text-white group-hover:rotate-180 transition-transform duration-500" />
              <span>Reconcile Ledger</span>
            </>
          ) : aiStatus === 'FAILED' ? (
            <>
              <AlertTriangleIcon className="w-3.5 h-3.5 text-white" />
              <span>Retry Reconciliation</span>
            </>
          ) : (
            <>
              <LightningBoltIcon className="w-3.5 h-3.5 text-white" />
              <span>Run AI Reconciliation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
