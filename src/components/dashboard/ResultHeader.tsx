import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MaskReveal, GlowSweep } from '../motion';

interface ResultHeaderProps {
  isDarkMode: boolean;
  onReset: () => void;
  onGenerateCard: () => void;
  isGeneratingCard: boolean;
}

export function ResultHeader({
  isDarkMode,
  onReset,
  onGenerateCard,
  isGeneratingCard
}: ResultHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8 md:mb-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl"
      >
        <button
          onClick={onReset}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-[0.2em] mb-5 md:mb-6 transition-all duration-300 group',
            isDarkMode
              ? 'text-white/40 hover:text-white/70 border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
              : 'text-zinc-400 hover:text-zinc-600 border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
          )}
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          New Scan
        </button>

        <h1
          className={cn(
            'text-4xl md:text-6xl lg:text-[72px] font-display italic leading-[0.88] tracking-tight mb-3',
            isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
          )}
        >
          <MaskReveal as="div" delay={0.1}>
            Analysis
          </MaskReveal>
          <MaskReveal as="div" delay={0.35}>
            <span
              className="not-italic font-sans font-black"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Complete.
            </span>
          </MaskReveal>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'text-sm md:text-base font-light tracking-wide',
            isDarkMode ? 'text-white/30' : 'text-zinc-400'
          )}
        >
          Neural scan processed with clinical precision
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlowSweep delay={1.2} duration={1.4} loop>
          <motion.button
            onClick={onGenerateCard}
            disabled={isGeneratingCard}
            whileHover={isGeneratingCard ? {} : { scale: 1.04 }}
            whileTap={isGeneratingCard ? {} : { scale: 0.97 }}
            className={cn(
              'relative group flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.14em] transition-all duration-300 overflow-hidden',
              isGeneratingCard && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              background: isGeneratingCard
                ? isDarkMode
                  ? 'rgba(255,255,255,0.04)'
                  : '#f4f4f5'
                : isDarkMode
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.04)',
              color: isGeneratingCard
                ? isDarkMode
                  ? 'rgba(255,255,255,0.25)'
                  : '#a1a1aa'
                : isDarkMode
                  ? '#e0e7ff'
                  : '#4338ca',
              border: `1px solid ${
                isGeneratingCard
                  ? isDarkMode
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.06)'
                  : isDarkMode
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(99,102,241,0.15)'
              }`
            }}
          >
            {!isGeneratingCard && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-indigo-500/[0.06] to-transparent" />
            )}
            {isGeneratingCard ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
            ) : (
              <Download className="w-3.5 h-3.5 relative z-10" />
            )}
            <span className="relative z-10">
              {isGeneratingCard ? 'Generating...' : 'Export Card'}
            </span>
          </motion.button>
        </GlowSweep>
      </motion.div>
    </div>
  );
}
