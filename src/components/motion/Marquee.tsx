import React from 'react';
import { motion } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

export interface MarqueeProps {
  /** Pixels per second. Default 50. */
  speed?: number;
  /** Reverse direction. */
  reverse?: boolean;
  /** Pause on hover. Default true. */
  pauseOnHover?: boolean;
  className?: string;
  itemClassName?: string;
  children?: React.ReactNode;
}

/**
 * Marquee — infinite horizontal ticker.
 *
 *  - High-tier: smooth motion at requested speed.
 *  - Mid: half speed, no hover pause logic.
 *  - Low / reduced-motion: rendered static (children visible, no scroll).
 *
 * Children are duplicated so the loop seam is invisible.
 */
export function Marquee({
  speed = 50,
  reverse = false,
  pauseOnHover = true,
  className,
  itemClassName,
  children
}: MarqueeProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const enabled = !motionDisabled && !prefersReducedMotion && preset.tier !== 'low';
  const tierMultiplier = preset.tier === 'high' ? 1 : 0.5;

  if (!enabled) {
    return (
      <div className={`overflow-hidden ${className ?? ''}`}>
        <div className="flex gap-8">{children}</div>
      </div>
    );
  }

  // Estimate duration: assume one copy is ~800px for default speed calc; the
  // animation goes from 0 → -50% so duration is half the loop time anyway.
  const duration = 800 / Math.max(speed * tierMultiplier, 1);

  return (
    <div
      className={`overflow-hidden relative ${className ?? ''}`}
      style={{
        maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)'
      }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap will-change-transform"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        whileHover={
          pauseOnHover && preset.tier === 'high'
            ? ({ animationPlayState: 'paused' } as any)
            : undefined
        }
      >
        {/* Two copies for seamless loop */}
        <div className={`flex gap-8 ${itemClassName ?? ''}`}>{children}</div>
        <div className={`flex gap-8 ${itemClassName ?? ''}`} aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
