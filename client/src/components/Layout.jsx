import React from 'react';

export default function Layout({ topnav, dock, headerRow, children }) {
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-900 flex flex-col selection:bg-[#007A4D]/20 p-2 sm:p-4 md:p-6 max-w-[1500px] mx-auto">
      {/* Top Navigation Bar */}
      {topnav}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex gap-4 md:gap-6 mt-3 sm:mt-4">
        {/* Floating Left Dock */}
        {dock}

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Row (Welcome Back, Sujon / Controller) */}
          {headerRow}

          {/* Main View Area */}
          <main className="flex-1 mt-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
