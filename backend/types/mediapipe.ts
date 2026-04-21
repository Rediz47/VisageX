/** A single 3D landmark point from MediaPipe FaceMesh. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** The array of 468–478 landmarks returned by MediaPipe FaceMesh. */
export type LandmarkArray = Landmark[];

/** Symmetry analysis result for a single facial feature pair. */
export interface SymmetryDetail {
  feature: string;
  score: number;
  observation: string;
}

/** Return type of analyzeSymmetry(). */
export interface SymmetryResult {
  symmetryScore: number;
  detailedSymmetry: SymmetryDetail[];
  avgSymmetryScore: number;
}

/** Return type of calculateMetrics(). */
export interface MetricsResult {
  overallScore: number;
  finalEyeScore: number;
  finalJawScore: number;
  proportionsScore: number;
  fwhrScore: number;
  avgCanthalTilt: number;
  fWHR: number;
  heightToWidthRatio: number;
  midfaceRatio: number;
  lowerFaceRatio: number;
  eyeSpacingRatio: number;
  noseWidthRatio: number;
  mouthWidthRatio: number;
  strengths: string[];
  weaknesses: string[];
}
