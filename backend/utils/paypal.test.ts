import { describe, it, expect } from 'vitest';
import {
  extractPayPalOrderMetadata,
  extractPayPalOrderIdFromWebhook,
  isPayPalSettlementComplete
} from './paypal.js';

describe('extractPayPalOrderMetadata', () => {
  it('returns null when payload has no purchase units or custom_id', () => {
    expect(extractPayPalOrderMetadata({})).toBeNull();
    expect(extractPayPalOrderMetadata(null)).toBeNull();
    expect(extractPayPalOrderMetadata(undefined)).toBeNull();
  });

  it('returns null when custom_id is not valid JSON', () => {
    expect(
      extractPayPalOrderMetadata({
        purchase_units: [{ custom_id: 'not-json' }]
      })
    ).toBeNull();
  });

  it('returns null when custom_id JSON lacks userId or planId', () => {
    expect(
      extractPayPalOrderMetadata({
        purchase_units: [{ custom_id: JSON.stringify({ userId: 'u1' }) }]
      })
    ).toBeNull();
    expect(
      extractPayPalOrderMetadata({
        purchase_units: [{ custom_id: JSON.stringify({ planId: 'pro' }) }]
      })
    ).toBeNull();
  });

  it('extracts metadata from purchase_units[].custom_id', () => {
    const result = extractPayPalOrderMetadata({
      purchase_units: [{ custom_id: JSON.stringify({ userId: 'u1', planId: 'pro' }) }]
    });
    expect(result).toEqual({ userId: 'u1', planId: 'pro' });
  });

  it('extracts metadata from payments.captures[].custom_id when top-level is missing', () => {
    const result = extractPayPalOrderMetadata({
      purchase_units: [
        {
          payments: {
            captures: [{ custom_id: JSON.stringify({ userId: 'u2', planId: 'starter' }) }]
          }
        }
      ]
    });
    expect(result).toEqual({ userId: 'u2', planId: 'starter' });
  });

  it('rejects non-string userId/planId values', () => {
    expect(
      extractPayPalOrderMetadata({
        purchase_units: [{ custom_id: JSON.stringify({ userId: 123, planId: 'pro' }) }]
      })
    ).toBeNull();
  });
});

describe('extractPayPalOrderIdFromWebhook', () => {
  it('reads order_id from supplementary_data on PAYMENT.CAPTURE.COMPLETED', () => {
    expect(
      extractPayPalOrderIdFromWebhook('PAYMENT.CAPTURE.COMPLETED', {
        supplementary_data: { related_ids: { order_id: 'O-1' } }
      })
    ).toBe('O-1');
  });

  it('falls back to supplemental_data spelling', () => {
    expect(
      extractPayPalOrderIdFromWebhook('PAYMENT.CAPTURE.COMPLETED', {
        supplemental_data: { related_ids: { order_id: 'O-2' } }
      })
    ).toBe('O-2');
  });

  it('reads resource.id for CHECKOUT.ORDER.* events', () => {
    expect(extractPayPalOrderIdFromWebhook('CHECKOUT.ORDER.APPROVED', { id: 'O-3' })).toBe('O-3');
  });

  it('returns null for unknown event types', () => {
    expect(
      extractPayPalOrderIdFromWebhook('BILLING.SUBSCRIPTION.CREATED', { id: 'S-1' })
    ).toBeNull();
  });
});

describe('isPayPalSettlementComplete', () => {
  it('returns true only for COMPLETED', () => {
    expect(isPayPalSettlementComplete('COMPLETED')).toBe(true);
    expect(isPayPalSettlementComplete('PENDING')).toBe(false);
    expect(isPayPalSettlementComplete('APPROVED')).toBe(false);
    expect(isPayPalSettlementComplete(undefined)).toBe(false);
  });
});
