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

      {/* Right: Settlement Q&A Button, Search, Notification Bell, User Avatar */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007A4D] hover:bg-[#00603C] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <span>💬</span>
          <span className="hidden sm:inline">Settlement Q&A</span>
        </button>

        <button
          onClick={onToggleChat}
          title="Search / Settlement Assistant"
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#007A4D]" />
          )}
        </button>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer">
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
          title="Settlement Q&A Assistant"
          className="w-12 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-[#007A4D] hover:bg-gray-100 transition-all cursor-pointer relative"
        >
          <div className="relative">
            <ChatBubbleIcon className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#007A4D]" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight mt-0.5 leading-none">Q&A</span>
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

// ── 3. Header Greeting Row (matching "Welcome Back, Sujon" + Date/CTA) ──
export function QuixoticHeaderRow({ onRunAgent, isRunning, txCount = 55, onToggleChat }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Welcome Back, <span className="font-semibold text-gray-800">Controller</span>
        </h1>
      </div>

      {/* Right Controls: Date Range capsule + Settlement Q&A + Action Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date capsule matching reference image */}
        <div className="flex items-center gap-2 bg-white border border-gray-200/80 rounded-full px-4 py-2 text-xs font-medium text-gray-700 shadow-xs">
          <span>📅</span>
          <span>01 Jul, 2026 - 04 Aug, 2026</span>
          <span className="text-gray-400 text-[10px]">⌵</span>
        </div>

        {/* Settlement Q&A Header Button */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#007A4D] border border-emerald-200/90 rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span>💬</span>
            <span>Settlement Q&A</span>
          </button>
        )}

        {/* Action Button matching "+ Add New Wallet" or green button */}
        <button
          onClick={onRunAgent}
          disabled={isRunning}
          className="flex items-center gap-2 bg-[#007A4D] hover:bg-[#00603C] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI Pipeline Running…</span>
            </>
          ) : (
            <>
              <span className="text-white font-bold">+</span>
              <span>⚡ Run AI Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
