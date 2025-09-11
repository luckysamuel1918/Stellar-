import React from 'react';

const logoDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwNzdGRjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMEQ0RkY7c3RvcC1wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0idXJsKCNncmFkMSkiLz48dGV4dCB4PSI1MCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJJbnRlciwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1MCIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlc8L3RleHQ+PC9zdmc+";

export const WestcoastLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center font-bold text-westcoast-dark dark:text-white ${className}`}>
    <img src={logoDataUri} alt="Westcoast Trust Bank Logo" className="h-8 w-8 mr-2" />
    <span className="text-2xl tracking-tight">Westcoast</span>
  </div>
);