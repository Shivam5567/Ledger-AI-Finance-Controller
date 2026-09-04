import React from 'react';

export default function TopBar({
  title,
  subtitle,
  onRunAgent,
  isRunning,
  onToggleChat,
  chatOpen,
  hasIngested,
  onIngest,
  isIngesting,
  onExport,
  hasRunAgent,
}) {
  return (
    <header className="h-16 px-8 border-b border-[#2A2A2E] bg-[#0D0D0F] flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-[18px] font-semibold text-[#F5F5F5] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-[#8A8A8E]">{subtitle}</p>}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {hasIngested && onExport && hasRunAgent && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#8A8A8E] hover:text-[#F5F5F5] bg-[#141416] hover:bg-[#1C1C1F] border border-[#2A2A2E] transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        )}

        {hasIngested && (
          <button
            onClick={onIngest}
            disabled={isIngesting || isRunning}
            className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#8A8A8E] hover:text-[#F5F5F5] bg-[#141416] hover:bg-[#1C1C1F] border border-[#2A2A2E] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isIngesting ? 'Reloading…' : 'Reload CSV'}
          </button>
        )}

        {/* Settlement Q&A trigger button */}
        {hasRunAgent && (
          <button
            onClick={onToggleChat}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer ${
              chatOpen
                ? 'bg-[#1C1C1F] text-[#4F6EF7] border border-[#4F6EF7]/40'
                : 'bg-[#141416] text-[#8A8A8E] hover:text-[#F5F5F5] border border-[#2A2A2E]'
            }`}
          >
            <span>💬</span>
            <span>Settlement Q&A</span>
          </button>
        )}

        {/* Primary Run Agent Button */}
        {hasIngested && (
          <button
            onClick={onRunAgent}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-[#1C1C1F] text-[#8A8A8E] border border-[#2A2A2E] cursor-not-allowed'
                : 'bg-[#4F6EF7] text-white hover:bg-[#3D5DE8] active:scale-[0.98]'
            }`}
          >
            {isRunning ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-[#8A8A8E] border-t-transparent animate-spin" />
                <span>Running Pipeline…</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Run Agent</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
