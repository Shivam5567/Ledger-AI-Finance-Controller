import React from 'react';

// Brand emblem matching Quixotic-style green logo
export function LogoIcon({ className = "w-9 h-9" }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="18" fill="#007A4D" />
      <path d="M12 18C12 14.6863 14.6863 12 18 12C20.5 12 22.6 13.5 23.5 15.8L20.2 17.2C19.8 16 18.9 15.3 18 15.3C16.5 15.3 15.3 16.5 15.3 18C15.3 19.5 16.5 20.7 18 20.7C19.2 20.7 20.2 19.8 20.5 18.7H17.5V16H23.5V20C22.4 22.4 20.4 24 18 24C14.6863 24 12 21.3137 12 18Z" fill="white" />
      <circle cx="25" cy="12" r="3" fill="#A3D9C9" />
    </svg>
  );
}

// Arrow top right ↗ seen on all cards
export function ArrowUpRightIcon({ className = "w-4 h-4 text-gray-400" }) {
  return (
    <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
      </svg>
    </div>
  );
}

// Search icon
export function SearchIcon({ className = "w-4 h-4 text-gray-500" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

// Bell notification icon
export function BellIcon({ className = "w-4 h-4 text-gray-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
}

// Dock icons
export function DashboardGridIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function BarChartIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}

export function WalletIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
      <path d="M3 7v13a2 2 0 0 0 2 2h16v-5"></path>
      <path d="M18 12a2 2 0 0 0 0 4h3v-4Z"></path>
    </svg>
  );
}

export function TableListIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}

export function CreditCardIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
  );
}

export function ChatBubbleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export function ShieldAlertIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}

export function SettingsGearIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

export function ReloadIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v6h6"></path>
      <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
      <path d="M21 22v-6h-6"></path>
      <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
    </svg>
  );
}

// Brand Logo Badges for table
export function VendorBadge({ name, category }) {
  const n = (name || '').toLowerCase();
  
  if (n.includes('google')) {
    return (
      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm shadow-xs font-bold text-blue-500">
        G
      </div>
    );
  }
  if (n.includes('amazon') || n.includes('aws')) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#FF9900]/10 border border-[#FF9900]/30 flex items-center justify-center text-sm font-bold text-[#E68A00]">
        a
      </div>
    );
  }
  if (n.includes('facebook') || n.includes('meta')) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center text-sm font-bold text-[#1877F2]">
        f
      </div>
    );
  }
  if (n.includes('figma')) {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-sm font-bold text-purple-600">
        F
      </div>
    );
  }
  if (n.includes('slack')) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-600">
        #
      </div>
    );
  }
  if (n.includes('payroll')) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-600">
        ₹
      </div>
    );
  }
  if (n.includes('rent') || n.includes('office')) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-sm font-bold text-amber-600">
        🏢
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
      {(name || 'Tx').slice(0, 2).toUpperCase()}
    </div>
  );
}
