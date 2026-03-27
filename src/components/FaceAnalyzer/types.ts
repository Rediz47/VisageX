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
  visionAnalysis?: {
    colorSeason?: string;
    skinAnalysis?: string;
    aestheticsAnalysis?: string;
    potentialScore?: number;
    improvements?: string[];
    recommendedProducts?: Array<{ name: string; category: string; reason: string }>;
    faceShape?: string;
    hairRecommendations?: Array<{ styleName: string; reason: string }>;
    dermatology?: Record<string, number>;
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
