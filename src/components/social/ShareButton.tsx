import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  score?: number;
  achievement?: string;
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  score,
  achievement,
  className
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = achievement 
    ? `🏆 I just earned "${achievement}" in Tony Trivia! ${text}`
    : score 
    ? `🎯 I scored ${score} points in Tony Trivia! ${text}`
    : text;

  const handleShare = async (platform: 'twitter' | 'facebook' | 'native' | 'copy') => {
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: shareText,
              url: shareUrl
            });
          } catch (error) {
            console.error('Error sharing:', error);
          }
        }
        break;
      
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error('Error copying:', error);
        }
        break;
    }
    
    setIsOpen(false);
  };

  const ShareOption = ({ 
    icon: Icon, 
    label, 
    onClick, 
    color 
  }: { 
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color: string;
  }) => (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg",
        "hover:bg-gray-100 transition-colors"
      )}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </motion.button>
  );

  return (
    <div className={cn("relative", className)}>
      {/* Share Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-gradient-to-r from-electric-500 to-plasma-500",
          "text-white font-medium shadow-lg",
          "hover:shadow-xl transition-all"
        )}
      >
        <Share2 className="w-4 h-4" />
        Share
      </motion.button>

      {/* Share Options Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={cn(
                "absolute bottom-full mb-2 right-0 z-50",
                "bg-white rounded-xl shadow-2xl border border-gray-100",
                "p-4 min-w-[200px]"
              )}
            >
              <h4 className="font-semibold text-gray-800 mb-3">Share your result</h4>
              
              <div className="grid grid-cols-3 gap-2">
                <ShareOption
                  icon={Twitter}
                  label="Twitter"
                  onClick={() => handleShare('twitter')}
                  color="bg-[#1DA1F2]"
                />
                <ShareOption
                  icon={Facebook}
                  label="Facebook"
                  onClick={() => handleShare('facebook')}
                  color="bg-[#1877F2]"
                />
                {navigator.share && (
                  <ShareOption
                    icon={Share2}
                    label="More"
                    onClick={() => handleShare('native')}
                    color="bg-gray-600"
                  />
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleShare('copy')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2",
                    "px-3 py-2 rounded-lg",
                    "bg-gray-100 hover:bg-gray-200 transition-colors",
                    "text-gray-700 text-sm font-medium"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-energy-green" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Share card for results page
export function ShareCard({
  title,
  subtitle,
  stats,
  className
}: {
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br from-electric-50 to-plasma-50",
        "rounded-2xl p-6 border-2 border-electric-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-electric-700">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        <ShareButton
          title={title}
          text={`Check out my results in Tony Trivia!`}
          score={stats?.find(s => s.label === 'Score')?.value as number}
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 rounded-lg p-3 text-center"
            >
              <div className="text-2xl font-bold text-electric-600">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}