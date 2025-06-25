import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  onClick?: () => void;
}

interface MobileNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({
  items,
  activeId,
  onItemClick,
  className = '',
}) => {
  const handleItemClick = (item: NavItem) => {
    item.onClick?.();
    onItemClick?.(item.id);
  };

  return (
    <nav 
      className={`mobile-nav safe-padding-bottom bg-white ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                relative flex flex-col items-center justify-center
                flex-1 h-full px-2 py-2
                touch-feedback
                transition-colors duration-200
                ${isActive ? 'text-electric-600' : 'text-gray-500'}
              `}
              whileTap={{ scale: 0.95 }}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute top-0 left-1/2 w-12 h-1 bg-electric-500 rounded-b-full"
                    initial={{ x: '-50%', scaleX: 0 }}
                    animate={{ x: '-50%', scaleX: 1 }}
                    exit={{ x: '-50%', scaleX: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with badge */}
              <div className="relative mb-1">
                <Icon className={`w-6 h-6 ${isActive ? '' : ''}`} />
                {item.badge !== undefined && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                             bg-energy-red text-white text-xs font-bold
                             rounded-full flex items-center justify-center px-1"
                  >
                    {item.badge}
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span className={`text-xs font-medium ${isActive ? '' : ''}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;