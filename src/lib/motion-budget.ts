/**
 * Motion budget + concurrency singleton.
 *
 *  - `critical`   → ALWAYS runs (only blocked by prefers-reduced-motion upstream).
 *  - `secondary`  → runs if screen budget has room AND concurrency allows.
 *  - `decorative` → runs if budget + concurrency allow; NEVER queues.
 *
 * Screen-budget resets on route change, tab change, and modal open/close.
 */

import type { MotionPriority, MotionTier } from './motion';
import { maxAnimationsPerScreen, maxConcurrentAnimations } from './motion';

export type ResetReason = 'route' | 'tab' | 'modal' | 'manual';

export type SlotDecision = 'run' | 'skip';

interface BudgetState {
  tier: MotionTier;
  perScreenUsed: number;
  inFlight: number;
}

const state: BudgetState = {
  tier: 'high',
  perScreenUsed: 0,
  inFlight: 0
};

export function setBudgetTier(tier: MotionTier): void {
  state.tier = tier;
}

export function resetBudget(_reason: ResetReason = 'manual'): void {
  state.perScreenUsed = 0;
  // Do not reset inFlight — those animations are actually running; they'll
  // decrement themselves when they complete.
}

/**
 * Reserve a slot. Returns 'run' if allowed, 'skip' otherwise.
 * Callers should render static content when 'skip' is returned.
 */
export function requestSlot(priority: MotionPriority): SlotDecision {
  const { tier, perScreenUsed, inFlight } = state;
  const maxPer = maxAnimationsPerScreen[tier];
  const maxConc = maxConcurrentAnimations[tier];

  if (priority === 'critical') {
    return 'run';
  }

  if (priority === 'secondary') {
    if (perScreenUsed >= maxPer) return 'skip';
    if (inFlight >= maxConc) return 'skip';
    return 'run';
  }

  // decorative
  if (tier === 'low') return 'skip';
  if (perScreenUsed >= maxPer) return 'skip';
  if (inFlight >= maxConc) return 'skip';
  return 'run';
}

/**
 * Mark an animation as started. Increments both counters.
 * Pair with endAnimation() on completion.
 */
export function startAnimation(priority: MotionPriority): void {
  state.inFlight += 1;
  if (priority !== 'critical') {
    state.perScreenUsed += 1;
  }
}

export function endAnimation(): void {
  if (state.inFlight > 0) state.inFlight -= 1;
}

/** Dev-only inspector. Attached to window in MotionProvider in dev. */
export function __debugState(): BudgetState & { maxPer: number; maxConc: number } {
  return {
    ...state,
    maxPer: maxAnimationsPerScreen[state.tier],
    maxConc: maxConcurrentAnimations[state.tier]
  };
}
