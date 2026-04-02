/**
 * VisageX Shared Type Definitions
 */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export interface AnalysisResult {
  overallScore: number;
  potentialScore: number;
  faceShape: string;
  color_season: string;
  skin_quality: number;
  overall_skin_score: number;
  acne_presence: number;
  wrinkle_visibility: number;
  skin_texture: number;
  dark_circles: number;
  redness: number;
  oiliness: number;
  grooming: number;
  cheekbone_prominence: number;
  overall_aesthetics_score: number;
  skinAnalysis: string;
  aestheticsAnalysis: string;
  visualStrengths: string[];
  visualWeaknesses: string[];
  improvements: string[];
  hairRecommendations: {
    styleName: string;
    reason: string;
  }[];
  recommendedProducts: {
    name: string;
    category: string;
    reason: string;
  }[];
}

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  credits: number;
  referralCode: string;
  invitedCount: number;
  referredBy?: string;
  createdAt: any;
  role: 'user' | 'admin';
  lastIp?: string;
  lastFingerprint?: string;
  referralRewardTriggered?: boolean;
}
