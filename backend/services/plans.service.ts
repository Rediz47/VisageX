/**
 * Centralized plan configuration — single source of truth for credit amounts and pricing.
 * Used by create-order, capture-order, and webhook handlers.
 */

export interface PlanConfig {
  id: string;
  name: string;
  price: string;
  credits: number;
}

export const PLANS: Record<string, PlanConfig> = {
  price_single: { id: 'price_single', name: 'Trial', price: '1.49', credits: 1 },
  price_basic: { id: 'price_basic', name: 'Explorer', price: '4.99', credits: 5 },
  price_pro: { id: 'price_pro', name: 'Max Potential', price: '12.99', credits: 15 },
  price_elite: { id: 'price_elite', name: 'Elite', price: '29.99', credits: 50 }
};

/** Returns the credit count for a plan. Falls back to 0 for unknown plans. */
export function getPlanCredits(planId: string): number {
  return PLANS[planId]?.credits ?? 0;
}

/** Returns the USD price string for a plan. Falls back to '29.99' for unknown plans. */
export function getPlanPrice(planId: string): string {
  return PLANS[planId]?.price ?? '29.99';
}

/** Returns the human-readable plan name. Falls back to 'Elite' for unknown plans. */
export function getPlanName(planId: string): string {
  return PLANS[planId]?.name ?? 'Elite';
}
