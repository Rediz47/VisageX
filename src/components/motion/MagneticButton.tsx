import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

export interface MagneticButtonProps {
  /** Max pixel offset toward the cursor. Default 10. */
  strength?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  children?: React.ReactNode;
}

/**
 * MagneticButton — cursor-follow micro-interaction.
 *
 *  - Tracks pointer over the element bounds and translates the inner content
 *    a fraction of the offset toward the cursor.
 *  - Spring-smoothed so it never feels jittery.
 *  - Only enabled on `(hover: hover) and (pointer: fine)` devices via the
 *    motion tier `enableHoverMicro` flag — touch devices passthrough.
 */
export function MagneticButton({
  strength = 10,
  className,
  style,
  onClick,
  type = 'button',
  ariaLabel,
  children
}: MagneticButtonProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const ref = useRef<HTMLButtonElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const innerX = useTransform(springX, (v) => v * 0.5);
  const innerY = useTransform(springY, (v) => v * 0.5);

  const enabled = !motionDisabled && !prefersReducedMotion && preset.flags.enableHoverMicro;

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const max = strength;
    // Clamp so the button never escapes its layout box.
    x.set(Math.max(-max, Math.min(max, (dx / rect.width) * max * 2)));
    y.set(Math.max(-max, Math.min(max, (dy / rect.height) * max * 2)));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  if (!enabled) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-label={ariaLabel}
        className={className}
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ ...style, overflow: 'hidden' }}
    >
      <motion.span
        style={{ x: innerX, y: innerY, display: 'inline-block', willChange: 'transform' }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
