export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface AnalysisResult {
  overallScore: number;
  breakdown: Record<string, number>;
  metrics: Record<string, string | number>;
  detailedSymmetry: Array<{ feature: string; score: number; observation: string }>;
  analysis: {
    strengths: string[];
    weaknesses: string[];
  };
  landmarks?: Landmark[];
  /** Crop offsets used during processing — needed to map landmarks to the cropped image */
  cropInfo?: { cropX: number; cropY: number; imgWidth: number; imgHeight: number; cropW: number; cropH: number };
  visionAnalysis?: {
    colorSeason?: string;
    skinAnalysis?: string;
    aestheticsAnalysis?: string;
    potentialScore?: number;
    improvements?: string[];
    recommendedProducts?: Array<{ name: string; category: string; reason: string }>;
    faceShape?: string;
    hairRecommendations?: Array<{ styleName: string; reason: string }>;
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
    dermatology?: Record<string, number>;
    celebritySimilarity?: any[];
  };
  historyImage?: string;
}

export interface SaveStatus {
  message: string;
  type: 'success' | 'error';
}

export interface FaceAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult, imageUrl: string, isLocked: boolean) => void;
  userCredits: number;
  isDarkMode: boolean;
}
