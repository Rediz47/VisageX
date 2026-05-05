import React from 'react';
import { motion } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';
import { easings } from '../../lib/motion';

export interface MaskRevealProps {
  /** Direction of the wipe. Default 'up' (mask slides up to reveal). */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Optional enter delay in seconds. */
  delay?: number;
  /** Override duration. Defaults to preset.durations.slow. */
  duration?: number;
  /** Tag. Default 'span' for use in headings. */
  as?: 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * MaskReveal — clip-path "wipe" reveal where content slides into view from
 * behind a moving mask. More dramatic than a simple fade because the text
 * appears progressively rather than gaining opacity.
 *
 *  - low tier / reduced-motion → fade only (no clip-path).
 *  - mid tier → clip-path with shorter duration.
 *  - high tier → clip-path with subtle skew + scale companion.
 */
export function MaskReveal({
  direction = 'up',
  delay = 0,
  duration,
  as = 'span',
  className,
  style,
  children
}: MaskRevealProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const Tag = (as === 'div' ? motion.div : motion.span) as any;
  const fallback = motionDisabled || prefersReducedMotion || preset.tier === 'low';
  const dur = duration ?? preset.durations.slow * 1.2;

  if (fallback) {
    // Simple fade only.
    return (
      <Tag
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: preset.durations.med, ease: easings.easeOutExpo, delay }}
        className={className}
        style={style}
      >
        {children}
      </Tag>
    );
  }

  // clip-path values: each side is inset(top right bottom left).
  // 'up' → start with inset(100% 0 0 0), end at 0.
  const clipInitial =
    direction === 'up'
      ? 'inset(100% 0 0 0)'
      : direction === 'down'
        ? 'inset(0 0 100% 0)'
        : direction === 'left'
          ? 'inset(0 100% 0 0)'
          : 'inset(0 0 0 100%)';

  const skew =
    preset.tier === 'high'
      ? direction === 'up' || direction === 'down'
        ? { skewY: '6deg' }
        : { skewX: '6deg' }
      : {};

  return (
    <span
      style={{
        display: as === 'span' ? 'inline-block' : 'block',
        overflow: 'hidden',
        verticalAlign: 'bottom'
      }}
      className={className}
    >
      <Tag
        initial={{ clipPath: clipInitial, opacity: 0, ...skew }}
        animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1, skewX: 0, skewY: 0 }}
        transition={{ duration: dur, ease: easings.easeOutExpo, delay }}
        style={{ display: 'inline-block', willChange: 'clip-path, transform', ...style }}
      >
        {children}
      </Tag>
    </span>
  );
}
