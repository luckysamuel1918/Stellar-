import React from 'react';

export const WestcoastLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center font-bold text-westcoast-dark dark:text-white ${className}`}>
    <img src="/favicon.ico" alt="Westcoast Trust Bank Logo" className="h-8 w-8 mr-2" />
    <span className="text-2xl tracking-tight">Westcoast</span>
  </div>
);