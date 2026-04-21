/**
 * Core TypeScript interfaces for the VisageX analysis pipeline.
 * Replaces `any` types across the codebase with strict contracts.
 */

// ── AI Vision Analysis (returned from /api/gemini-analysis) ─────────────

export interface HairRecommendation {
  styleName: string;
  reason: string;
}

export interface RecommendedProduct {
  name: string;
  category: string;
  reason: string;
}

export interface CelebritySimilarity {
  name: string;
  percentage: number;
  reason: string;
  imageUrl: string;
}

export interface VisionAnalysis {
  overall_skin_score: number;
  acne_presence: number;
  wrinkle_visibility: number;
  skin_texture: number;
  dark_circles: number;
  redness: number;
  oiliness: number;
  skin_quality: number;
  grooming: number;
  cheekbone_prominence: number;
  overall_aesthetics_score: number;
  faceShape: string;
  color_season: string;
  skinAnalysis: string;
  aestheticsAnalysis: string;
  potentialScore: number;
  visualStrengths: string[];
  visualWeaknesses: string[];
  improvements: string[];
  hairRecommendations: HairRecommendation[];
  recommendedProducts: RecommendedProduct[];
  insightDescriptions?: Record<string, string>;
  improvementPlan?: Array<{
    title: string;
    category: 'Foundational' | 'Non-Invasive' | 'Minimally Invasive' | 'Surgical';
    difficulty: number;
    description: string;
    details: string;
    expectedImpact: string;
    costRange: string;
    timeframe: string;
    recovery: string | null;
    targetAreas: string[];
  }>;
  celebritySimilarity?: CelebritySimilarity[];
  dermatology?: Record<string, unknown>;
}

// ── Breakdown Scores ────────────────────────────────────────────────────

export interface BreakdownScores {
  Eyes: number;
  Symmetry: number;
  Jawline: number;
  Hair: number;
  Dimorphism: number;
  'Skin Quality'?: number;
  Grooming?: number;
  Cheekbones?: number;
  [key: string]: number | undefined;
}

// ── Detailed Symmetry ───────────────────────────────────────────────────

export interface SymmetryDetail {
  label: string;
  score: number;
  description?: string;
}

// ── Analysis Insights ───────────────────────────────────────────────────

export interface AnalysisInsightsData {
  strengths: string[];
  weaknesses: string[];
}

// ── Full Scan Result (the main object passed through the app) ───────────

export interface AnalysisResult {
  overallScore: number;
  breakdown: BreakdownScores;
  metrics: Record<string, string | number>;
  analysis: AnalysisInsightsData;
  detailedSymmetry?: SymmetryDetail[];
  visionAnalysis?: VisionAnalysis;
  landmarks?: { x: number; y: number }[];
  cropInfo?: CropInfo;
}

export interface CropInfo {
  cropX: number;
  cropY: number;
  imgWidth: number;
  imgHeight: number;
  cropW: number;
  cropH: number;
}

// ── Radar Chart Data ────────────────────────────────────────────────────

export interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

// ── Firebase User Document ──────────────────────────────────────────────

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: unknown; // Firestore Timestamp
  role: 'user' | 'admin';
  credits: number;
  referralCode?: string;
  invitedCount?: number;
  referredBy?: string;
  lastIp?: string;
  lastFingerprint?: string;
  referralRewardTriggered?: boolean;
}
