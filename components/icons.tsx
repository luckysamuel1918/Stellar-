import React from 'react';

export const StellarLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center font-bold text-stellar-dark ${className}`}>
    <svg className="h-8 w-8 mr-2 text-stellar-blue" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9.44721 9.44721L2 12L9.44721 14.5528L12 22L14.5528 14.5528L22 12L14.5528 9.44721L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 6L17.1213 8.12132L15 9L17.1213 9.87868L18 12L18.8787 9.87868L21 9L18.8787 8.12132L18 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="text-2xl tracking-tight">Stellar</span>
  </div>
);