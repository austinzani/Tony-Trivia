import React from 'react';

/**
 * Development-only component that shows the current responsive breakpoint
 * Helps with testing and debugging responsive layouts
 */
const ResponsiveIndicator: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white px-3 py-2 rounded-full text-xs font-mono">
      <span className="sm:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </div>
  );
};

export default ResponsiveIndicator;