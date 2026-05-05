/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VisageX — Device-Tiered Motion System
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Duration-token rule (enforced in new code):
 *   ❌ Forbidden: hardcoded ms (`duration: 300`, `duration-150`, `300ms`)
 *   ✅ Required:  var(--dur-fast | --dur-med | --dur-slow)
 *                  OR preset.durations.* from useMotionTier()
 *
 * See docs/MOTION.md for the full contract.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type MotionTier = 'low' | 'mid' | 'high';
export type MotionPriority = 'critical' | 'secondary' | 'decorative';

/**
 * Hard override for debugging / rollback.
 *   null  → auto-detect (recommended)
 *  'high' | 'mid' | 'low' → force tier
 *  'off'  → primitives become passthrough (no animation, no budget)
 */
export const FORCE_TIER: MotionTier | 'off' | null = null;

/** Premium easings (transform/opacity friendly). */
export const easings = {
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeOutQuint: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number]
};

export const springSoft = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 26,
  mass: 0.9
};

/** Budget + concurrency caps, per tier. */
export const maxAnimationsPerScreen: Record<MotionTier, number> = {
  low: 2,
  mid: 5,
  high: Infinity
};

export const maxConcurrentAnimations: Record<MotionTier, number> = {
  low: 1,
  mid: 2,
  high: 4
};

export interface MotionFlags {
  enableParallax: boolean;
  enableScrollHooks: boolean;
  enableBlurAnimations: boolean;
  enableAmbientGlow: boolean;
  enableHoverMicro: boolean;
  enableCounterTween: boolean;
  enableTabLayoutSpring: boolean;
  enableLenis: boolean;
}

export interface MotionPreset {
  tier: MotionTier;
  /** Clamped premium durations in seconds (hard max 0.8s). */
  durations: { fast: number; med: number; slow: number };
  /** Stagger delay in seconds between siblings. */
  stagger: number;
  /** Default transition for primitives. */
  defaultTransition: { duration: number; ease: [number, number, number, number] };
  flags: MotionFlags;
  /** Max simultaneous in-flight animations. */
  maxConcurrent: number;
  /** Max animations allowed per screen (route/tab/modal reset). */
  maxPerScreen: number;
}

// Durations in seconds. Hard max 1.4s on high so dramatic entrance animations
// have room to breathe. Low tier still animates — just faster — so the
// interface remains lively instead of feeling dead.
const DURATIONS: Record<MotionTier, { fast: number; med: number; slow: number }> = {
  low: { fast: 0.12, med: 0.2, slow: 0.3 },
  mid: { fast: 0.25, med: 0.5, slow: 0.85 },
  high: { fast: 0.35, med: 0.75, slow: 1.2 }
};

const STAGGER: Record<MotionTier, number> = { low: 0, mid: 0.04, high: 0.07 };

const FLAGS: Record<MotionTier, MotionFlags> = {
  low: {
    enableParallax: false,
    enableScrollHooks: false,
    enableBlurAnimations: false,
    enableAmbientGlow: false,
    enableHoverMicro: true, // cheap, transform-only
    enableCounterTween: false,
    enableTabLayoutSpring: false,
    enableLenis: false
  },
  mid: {
    enableParallax: true, // subtle, clamped
    enableScrollHooks: true,
    enableBlurAnimations: false,
    enableAmbientGlow: true, // static radial gradients; very cheap
    enableHoverMicro: true,
    enableCounterTween: true,
    enableTabLayoutSpring: true,
    enableLenis: true
  },
  high: {
    enableParallax: true,
    enableScrollHooks: true,
    enableBlurAnimations: true,
    enableAmbientGlow: true,
    enableHoverMicro: true,
    enableCounterTween: true,
    enableTabLayoutSpring: true,
    enableLenis: true
  }
};

export function getMotionPreset(tier: MotionTier): MotionPreset {
  const d = DURATIONS[tier];
  return {
    tier,
    durations: d,
    stagger: STAGGER[tier],
    defaultTransition: { duration: d.med, ease: easings.easeOutExpo },
    flags: FLAGS[tier],
    maxConcurrent: maxConcurrentAnimations[tier],
    maxPerScreen: maxAnimationsPerScreen[tier]
  };
}

/** Detect whether the user prefers reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface Connection {
  effectiveType?: string;
  saveData?: boolean;
}

/**
 * Tier detection — purely HARDWARE/NETWORK capability.
 *
 * Philosophy: default to `high`. prefers-reduced-motion is tracked SEPARATELY
 * (see `rm` in MotionProvider) because it's a motion PREFERENCE, not a hardware
 * constraint. A high-end laptop with reduce-motion on is still high-tier; it
 * just gets fewer decorative animations via the `rm` gate.
 *
 *   low  = saveData
 *        OR effectiveType ∈ {slow-2g, 2g}
 *        OR (deviceMemory <= 2 AND cores <= 2)
 *   mid  = mobile width (<768)
 *        OR deviceMemory <= 4
 *        OR cores <= 4
 *   high = everything else (default when metrics unknown)
 */
export function detectDeviceTier(): MotionTier {
  if (FORCE_TIER && FORCE_TIER !== 'off') return FORCE_TIER;
  if (typeof window === 'undefined') return 'high';

  // Dev/debug override: ?motion=high|mid|low persists in sessionStorage.
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('motion');
    if (q === 'high' || q === 'mid' || q === 'low') {
      window.sessionStorage.setItem('visagex_motion_tier', q);
    }
    const stored = window.sessionStorage.getItem('visagex_motion_tier');
    if (stored === 'high' || stored === 'mid' || stored === 'low') {
      return stored as MotionTier;
    }
  } catch {
    /* ignore storage errors */
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: Connection;
  };

  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined;
  const conn = nav.connection;
  const et = conn?.effectiveType;
  const saveData = conn?.saveData === true;

  const veryConstrained = mem !== undefined && cores !== undefined && mem <= 2 && cores <= 2;

  if (saveData || et === 'slow-2g' || et === '2g' || veryConstrained) {
    return 'low';
  }

  const isMobile = window.innerWidth < 768;
  if (isMobile || (mem !== undefined && mem <= 4) || (cores !== undefined && cores <= 4)) {
    return 'mid';
  }

  return 'high';
}

/** Force-tier respecting 'off'. Used by primitives to passthrough entirely. */
export function isMotionDisabled(): boolean {
  return FORCE_TIER === 'off';
}
