import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

export interface ParallaxProps {
  /** Base y-range amplitude in px on 'high'. Auto-scaled by viewport and tier. */
  maxPx?: number;
  /** Direction multiplier. Default 1 (scroll down → element moves up). */
  direction?: 1 | -1;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Parallax — transform: translateY driven by scroll.
 *
 *  - Respects `flags.enableScrollHooks`: no useScroll computation on low tier.
 *  - Range = min(viewportHeight * 0.04, maxPx) on high, half on mid, 0 elsewhere.
 *  - Transform-only (compositor-friendly). No filter, no blur.
 */
export function Parallax({ maxPx = 32, direction = 1, className, style, children }: ParallaxProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const { flags, tier } = preset;
  const ref = useRef<HTMLDivElement | null>(null);

  const enabled =
    !motionDisabled && !prefersReducedMotion && flags.enableScrollHooks && flags.enableParallax;

  // Always call hooks to keep order stable; only USE output when enabled.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const baseRange = Math.min(vh * 0.04, maxPx);
  const tierScale = tier === 'high' ? 1 : tier === 'mid' ? 0.5 : 0;
  const range = baseRange * tierScale * direction;

  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);

  if (!enabled) {
    return (
      <div ref={ref} className={className} style={{ position: 'relative', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ position: 'relative', ...style, y }}>
      {children}
    </motion.div>
  );
}
