interface PayPalCustomIdPayload {
  userId?: string;
  planId?: string;
}

function parseCustomId(customIdRaw: unknown): PayPalCustomIdPayload | null {
  if (typeof customIdRaw !== 'string' || !customIdRaw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(customIdRaw) as PayPalCustomIdPayload;
    return {
      userId: typeof parsed.userId === 'string' ? parsed.userId : undefined,
      planId: typeof parsed.planId === 'string' ? parsed.planId : undefined
    };
  } catch {
    return null;
  }
}

export function isPayPalSettlementComplete(status: unknown): boolean {
  return status === 'COMPLETED';
}

export function extractPayPalOrderMetadata(payload: any): PayPalCustomIdPayload | null {
  const purchaseUnits = Array.isArray(payload?.purchase_units) ? payload.purchase_units : [];
  const customIdCandidates: unknown[] = [
    payload?.custom_id,
    ...purchaseUnits.map((unit: any) => unit?.custom_id),
    ...purchaseUnits.map((unit: any) => unit?.payments?.captures?.[0]?.custom_id)
  ];

  for (const candidate of customIdCandidates) {
    const parsed = parseCustomId(candidate);
    if (parsed?.userId && parsed?.planId) {
      return parsed;
    }
  }

  return null;
}

export function extractPayPalOrderIdFromWebhook(eventType: unknown, resource: any): string | null {
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    return (
      resource?.supplementary_data?.related_ids?.order_id ||
      resource?.supplemental_data?.related_ids?.order_id ||
      resource?.order_id ||
      null
    );
  }

  if (typeof resource?.id === 'string' && String(eventType || '').startsWith('CHECKOUT.ORDER.')) {
    return resource.id;
  }

  return null;
}
