import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: AnimatedButtonProps) {
  const baseStyles =
    'px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variantStyles =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500';

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles} ${className}`}
      onClick={onClick}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 },
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.button>
  );
}
