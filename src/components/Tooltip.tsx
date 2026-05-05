import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  isDarkMode: boolean;
}

export function Tooltip({ content, isDarkMode }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Info className="w-3 h-3 opacity-50 cursor-help" />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`absolute z-50 w-48 p-2 text-[10px] rounded-lg shadow-xl border ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-700'}`}
            style={{ bottom: '125%', left: '50%', transform: 'translateX(-50%)' }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
