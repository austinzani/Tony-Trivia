import React from 'react';
import { motion } from 'framer-motion';
import MobileNav from './MobileNav';
import { LucideIcon } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  nav?: {
    items: Array<{
      id: string;
      label: string;
      icon: LucideIcon;
      badge?: string | number;
      onClick?: () => void;
    }>;
    activeId: string;
    onItemClick?: (id: string) => void;
  };
  className?: string;
  showNav?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  header,
  nav,
  className = '',
  showNav = true,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {header && (
        <header className="bg-white border-b border-gray-200 safe-padding-top sticky top-0 z-40">
          {header}
        </header>
      )}

      {/* Main Content */}
      <main 
        className={`
          flex-1 overflow-y-auto
          ${showNav && nav ? 'pb-16' : 'safe-padding-bottom'}
          ${className}
        `}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      {showNav && nav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
          <MobileNav
            items={nav.items}
            activeId={nav.activeId}
            onItemClick={nav.onItemClick}
          />
        </div>
      )}
    </div>
  );
};

export default MobileLayout;