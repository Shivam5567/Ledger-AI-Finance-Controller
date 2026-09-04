import React from 'react';

export default function Layout({ topnav, headerRow, children }) {
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-900 flex flex-col selection:bg-[#007A4D]/20 p-2.5 sm:p-4 md:p-6 max-w-[1500px] mx-auto w-full overflow-x-hidden">
      {/* Single Responsive Top Navigation Bar */}
      {topnav}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col mt-3 sm:mt-4 min-w-0">
        {/* Header Row (Filter Bar & Greetings) */}
        {headerRow}

        {/* Main View Area */}
        <main className="flex-1 mt-4 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
