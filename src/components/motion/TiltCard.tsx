import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
// (glare prop removed — see component body for rationale)
import { useMotionTier } from '../../context/MotionProvider';

export interface TiltCardProps {
  /** Max rotation in degrees on each axis. Default 12. */
  max?: number;
  /** Inner perspective in px. Default 1000. */
  perspective?: number;
  /** If true, also lift the card slightly toward the cursor. */
  glare?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * TiltCard — 3D mouse-tracking tilt with optional cursor glare.
 *
 *  - **High-tier only**: a non-trivial GPU effect. Mid/low devices passthrough.
 *  - Spring-smoothed so it never feels jittery.
 *  - Resets to neutral when the cursor leaves.
 */
export function TiltCard({
  max = 12,
  perspective = 1000,
  glare = true,
  className,
  style,
  children
}: TiltCardProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const ref = useRef<HTMLDivElement | null>(null);

  const enabled =
    !motionDisabled &&
    !prefersReducedMotion &&
    preset.tier === 'high' &&
    preset.flags.enableHoverMicro;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  // One spring for both axes (single rAF subscription); softer to reduce work.
  const sRx = useSpring(rx, { stiffness: 160, damping: 20, mass: 0.6 });
  const sRy = useSpring(ry, { stiffness: 160, damping: 20, mass: 0.6 });

  const transform = useTransform(
    [sRx, sRy] as any,
    ([x, y]: number[]) => `perspective(${perspective}px) rotateX(${x}deg) rotateY(${y}deg)`
  );

  // rAF-throttled pointer handler avoids one motion-value write per `mousemove`
  // event (browsers can fire 100+ per second).
  const rafPending = useRef(false);
  const lastEvent = useRef<{ px: number; py: number } | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    lastEvent.current = {
      px: (e.clientX - rect.left) / rect.width,
      py: (e.clientY - rect.top) / rect.height
    };
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      const ev = lastEvent.current;
      if (!ev) return;
      ry.set((ev.px - 0.5) * 2 * max);
      rx.set(-(ev.py - 0.5) * 2 * max);
    });
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  if (!enabled) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ ...style, transform, transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
      {/* `glare` prop is intentionally accepted but no longer rendered — the
          mix-blend-mode + radial-gradient combination forced the layer into a
          repaint each frame. The 3D tilt alone reads as plenty of polish. */}
    </motion.div>
  );
}
