import React from 'react';
import { motion } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

export interface GlowSweepProps {
  /** Total duration of one sweep in seconds. Default 1.4. */
  duration?: number;
  /** Delay before the sweep starts. */
  delay?: number;
  /** Repeat the sweep on a loop. */
  loop?: boolean;
  /** Sweep tint. Default white. */
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * GlowSweep — a diagonal light streak that sweeps across its children once
 * (or on a loop). Effective on dark CTAs and cards.
 *
 *  - High-tier only by default. Mid/low → passthrough.
 */
export function GlowSweep({
  duration = 1.4,
  delay = 0.3,
  loop = false,
  color = 'rgba(255,255,255,0.35)',
  className,
  children
}: GlowSweepProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const enabled = !motionDisabled && !prefersReducedMotion && preset.tier === 'high';

  if (!enabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`relative inline-block overflow-hidden ${className ?? ''}`}>
      {children}
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(115deg, transparent 30%, ${color} 50%, transparent 70%)`,
          mixBlendMode: 'screen',
          transform: 'translateX(-120%) skewX(-12deg)'
        }}
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
          repeat: loop ? Infinity : 0,
          repeatDelay: loop ? 2.5 : 0
        }}
      />
    </span>
  );
}
