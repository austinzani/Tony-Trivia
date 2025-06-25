import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface MobileToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
  showCloseButton?: boolean;
}

const MobileToast: React.FC<MobileToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 4000,
  onClose,
  position = 'bottom',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-energy-green text-white';
      case 'error':
        return 'bg-energy-red text-white';
      case 'warning':
        return 'bg-energy-yellow text-electric-900';
      case 'info':
      default:
        return 'bg-electric-600 text-white';
    }
  };

  const variants = {
    initial: {
      opacity: 0,
      y: position === 'top' ? -100 : 100,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: position === 'top' ? -50 : 50,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      key={id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        ${getStyles()}
        px-4 py-3 rounded-game shadow-lg
        flex items-center gap-3
        min-w-[280px] max-w-[calc(100vw-2rem)]
        mx-4
      `}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {showCloseButton && (
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-md transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
  }>;
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
}

export const MobileToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'bottom',
}) => {
  return (
    <div
      className={`
        fixed z-50
        ${position === 'top' 
          ? 'top-0 safe-padding-top pt-4' 
          : 'bottom-0 safe-padding-bottom pb-20 sm:pb-4'
        }
        left-0 right-0
        pointer-events-none
      `}
    >
      <div className={`
        flex flex-col gap-2
        ${position === 'top' ? '' : 'flex-col-reverse'}
        items-center
      `}>
        <AnimatePresence mode="sync">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <MobileToast
                {...toast}
                onClose={onClose}
                position={position}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileToast;