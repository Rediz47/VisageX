import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { useMotionTier } from '../context/MotionProvider';
import { easings } from '../lib/motion';

interface AnimatedCounterProps {
  value: number;
  /** Optional override (seconds). Clamped to ≤ 0.8s. */
  duration?: number;
  delay?: number;
  maxDecimals?: number;
}

/**
 * AnimatedCounter — tier-aware number tween.
 *  - low tier OR flags.enableCounterTween=false → static value, no animation.
 *  - Duration clamped to max 0.8s (premium feel, never slow).
 *  - Single-shot: re-animates only when target value actually changes.
 */
export const AnimatedCounter = React.memo(function AnimatedCounter({
  value,
  duration,
  delay = 0,
  maxDecimals = 1
}: AnimatedCounterProps) {
  const { preset, prefersReducedMotion } = useMotionTier();
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevValueRef = useRef<number | null>(null);
  const [staticText] = useState(() => value.toFixed(maxDecimals));

  const tweenEnabled = preset.flags.enableCounterTween && !prefersReducedMotion;

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Static path: just write the final value.
    if (!tweenEnabled) {
      el.textContent = value.toFixed(maxDecimals);
      prevValueRef.current = value;
      return;
    }

    // Skip if target didn't change.
    if (prevValueRef.current === value) return;

    const from = prevValueRef.current ?? 0;
    const requested = typeof duration === 'number' ? duration : preset.durations.slow;
    // Hard clamp: 0.2s min (so large jumps still feel intentional) and 0.8s max.
    const clamped = Math.max(0.2, Math.min(requested, 0.8));

    const controls = animate(from, value, {
      duration: clamped,
      delay,
      ease: easings.easeOutExpo,
      onUpdate: (v) => {
        if (el) el.textContent = v.toFixed(maxDecimals);
      }
    });
    prevValueRef.current = value;
    return () => controls.stop();
  }, [value, duration, delay, maxDecimals, tweenEnabled, preset.durations.slow]);

  return <span ref={spanRef}>{staticText}</span>;
});
