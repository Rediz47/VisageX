import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ── Reusable primitives ─────────────────────────────────────────────────

const base64ImageString = z.string().min(1, 'Image is required').max(15_000_000, 'Image too large (max ~10MB)');

// ── Endpoint schemas ────────────────────────────────────────────────────

export const geminiAnalysisSchema = z.object({
  image: base64ImageString,
});

export const celebrityLookalikeSchema = z.object({
  image: z.string().min(1, 'Image is required'),
});

export const glowCoachSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  context: z.object({
    overallScore: z.union([z.string(), z.number()]).optional(),
    faceShape: z.string().optional(),
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    potentialScore: z.union([z.string(), z.number()]).optional(),
    improvements: z.string().optional(),
  }).optional(),
});

const landmarkPoint = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const geometryAnalyzeSchema = z.object({
  landmarks: z.array(landmarkPoint).min(468, 'Must provide at least 468 landmarks').max(478),
});

export const paypalCreateOrderSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
});

export const paypalCaptureOrderSchema = z.object({
  orderID: z.string().min(1, 'Order ID is required'),
  planId: z.string().optional(),
});

export const referralRedeemSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required').max(20),
  fingerprint: z.string().optional(),
});

export const emailWelcomeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().max(100).optional(),
  userId: z.string().optional(),
});

// ── Validation middleware factory ────────────────────────────────────────

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure, returns 400 with structured error messages.
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data;
    next();
  };
}
