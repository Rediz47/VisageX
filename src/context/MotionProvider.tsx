import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';
import { MotionConfig } from 'motion/react';
import { useLocation } from 'react-router-dom';
import {
  detectDeviceTier,
  getMotionPreset,
  prefersReducedMotion,
  isMotionDisabled,
  type MotionPreset,
  type MotionTier,
  type MotionPriority
} from '../lib/motion';
import {
  requestSlot as budgetRequestSlot,
  startAnimation as budgetStart,
  endAnimation as budgetEnd,
  resetBudget as budgetReset,
  setBudgetTier,
  __debugState,
  type ResetReason,
  type SlotDecision
} from '../lib/motion-budget';

interface MotionContextValue {
  tier: MotionTier;
  preset: MotionPreset;
  prefersReducedMotion: boolean;
  motionDisabled: boolean;
  requestSlot: (priority: MotionPriority) => SlotDecision;
  startAnimation: (priority: MotionPriority) => void;
  endAnimation: () => void;
  resetBudget: (reason?: ResetReason) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<MotionTier>(() => detectDeviceTier());
  // Force `rm=false` so all gating logic across the app runs the full animation
  // path. (Was: `prefersReducedMotion()`.) Pair with `reducedMotion="never"`
  // on MotionConfig below.
  const [rm, setRm] = useState<boolean>(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // Keep the budget singleton synced with tier.
  useEffect(() => {
    setBudgetTier(tier);
  }, [tier]);

  // Reduced-motion listener disabled while we're force-overriding it.
  // (Re-enable along with `reducedMotion="user"` on MotionConfig if needed.)

  // Reflect tier on <html> for CSS scoping.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.motionTier = tier;
    return () => {
      delete document.documentElement.dataset.motionTier;
    };
  }, [tier]);

  // Reset screen budget on route change.
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      budgetReset('route');
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  // Dev-only debug hook: window.__motionDebug()
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (import.meta.env.DEV) {
      (window as unknown as { __motionDebug: () => unknown }).__motionDebug = __debugState;
    }
  }, []);

  const resetBudget = useCallback((reason: ResetReason = 'manual') => {
    budgetReset(reason);
  }, []);

  const requestSlot = useCallback(
    (priority: MotionPriority) => {
      if (rm && priority !== 'critical') return 'skip' as const;
      return budgetRequestSlot(priority);
    },
    [rm]
  );

  const startAnimation = useCallback((priority: MotionPriority) => {
    budgetStart(priority);
  }, []);

  const endAnimation = useCallback(() => {
    budgetEnd();
  }, []);

  const preset = useMemo(() => getMotionPreset(tier), [tier]);
  const motionDisabled = isMotionDisabled();

  const value = useMemo<MotionContextValue>(
    () => ({
      tier,
      preset,
      prefersReducedMotion: rm,
      motionDisabled,
      requestSlot,
      startAnimation,
      endAnimation,
      resetBudget
    }),
    [tier, preset, rm, motionDisabled, requestSlot, startAnimation, endAnimation, resetBudget]
  );

  // `reducedMotion="never"` tells motion to ALWAYS run animations regardless
  // of the OS-level `prefers-reduced-motion: reduce` flag. This is a deliberate
  // tradeoff: users with reduce-motion enabled (often vestibular sensitivity)
  // will still see the entrance animations. If you want strict accessibility,
  // change this to `"user"`.
  return (
    <MotionContext.Provider value={value}>
      <MotionConfig reducedMotion="never">{children}</MotionConfig>
    </MotionContext.Provider>
  );
}

export function useMotionTier(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    // Graceful fallback when used outside provider (e.g. tests, storybook).
    const tier: MotionTier = 'high';
    const preset = getMotionPreset(tier);
    return {
      tier,
      preset,
      prefersReducedMotion: false,
      motionDisabled: false,
      requestSlot: () => 'run',
      startAnimation: () => {},
      endAnimation: () => {},
      resetBudget: () => {}
    };
  }
  return ctx;
}
