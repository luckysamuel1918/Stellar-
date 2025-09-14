import React from 'react';

export const WestcoastLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center font-bold text-westcoast-dark dark:text-white ${className}`}>
    <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='45' fill='%230A2540'/%3e%3cpath d='M25 35 L40 65 L50 45 L60 65 L75 35' stroke='%23FFFFFF' stroke-width='8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e" alt="Westcoast Trust Bank Logo" className="h-8 w-8 mr-2" />
    <span className="text-2xl tracking-tight">Westcoast</span>
  </div>
);