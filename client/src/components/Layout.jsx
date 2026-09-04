import React from 'react';

export default function Layout({ sidebar, topbar, children }) {
  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F5F5] flex selection:bg-[#4F6EF7]/30">
      {/* Fixed 220px Sidebar */}
      {sidebar}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0D0D0F]">
        {/* Top bar */}
        {topbar}

        {/* Content Body */}
        <main className="flex-1 px-8 py-8 w-full max-w-[1200px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
