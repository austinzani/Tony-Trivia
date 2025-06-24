import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MobileButton from './MobileButton';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  preventClose?: boolean;
  fullScreen?: boolean;
  className?: string;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  preventClose = false,
  fullScreen = true,
  className = '',
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (!preventClose) {
      onClose();
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      y: fullScreen ? '100%' : 50,
      scale: fullScreen ? 1 : 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0,
      y: fullScreen ? '100%' : 50,
      scale: fullScreen ? 1 : 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-50
              ${fullScreen 
                ? 'inset-0 mobile-modal' 
                : 'inset-x-4 top-1/2 -translate-y-1/2 max-h-[90vh] rounded-card shadow-2xl'
              }
              bg-white
              ${className}
            `}
          >
            <div className={fullScreen ? 'mobile-modal-content' : 'flex flex-col h-full'}>
              {/* Header */}
              {(title || showCloseButton) && (
                <div className={`
                  flex items-center justify-between
                  ${fullScreen ? 'p-4 safe-padding-top' : 'p-4'}
                  border-b border-gray-200
                `}>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  {showCloseButton && (
                    <MobileButton
                      variant="secondary"
                      size="sm"
                      icon={X}
                      onClick={onClose}
                      className="!p-2 !min-h-0"
                      aria-label="Close modal"
                    />
                  )}
                </div>
              )}

              {/* Body */}
              <div className={`
                ${fullScreen ? 'mobile-modal-body' : 'flex-1 overflow-y-auto'}
                ${title || showCloseButton ? '' : fullScreen ? 'safe-padding-top' : 'pt-4'}
              `}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileModal;