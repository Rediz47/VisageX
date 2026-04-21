/**
 * Shared types and constants for the Facial Ratio Explorer.
 */

export interface RatioVisualization {
  name: string;
  shortName: string;
  value: number | string;
  idealRange: [number, number];
  score: number;
  unit?: string;
  description: string;
  confidence: number;
  contributesTo: string[];
  /** Landmark indices that define the measurement lines on the face */
  lines: { from: number; to: number; color: string; label?: string }[];
  /** Key landmark dots to highlight */
  dots: number[];
}

export interface FacialRatioExplorerProps {
  imageUrl: string;
  landmarks?: { x: number; y: number }[];
  cropInfo?: { cropX: number; cropY: number; imgWidth: number; imgHeight: number; cropW: number; cropH: number };
  metrics: Record<string, string | number>;
  breakdown: Record<string, number>;
  isDarkMode: boolean;
  isLocked?: boolean;
}

export const RATIO_GROUP_MAP: Record<string, string> = {
  fWHR: 'Face Structure', 'Jaw Angle': 'Face Structure', 'Jaw/Cheek': 'Face Structure',
  Thirds: 'Face Structure', 'Lower Face': 'Face Structure', Midface: 'Face Structure',
  Forehead: 'Face Structure', 'Jaw/Height': 'Face Structure', 'Chin Height': 'Face Structure', 'Face Index': 'Face Structure',
  'Canthal Tilt': 'Eyes', 'Eye Shape': 'Eyes', 'Eye Spacing': 'Eyes', 'Eye/Face W': 'Eyes',
  Intercanthal: 'Eyes', 'Eye Open': 'Eyes', 'Brow Lift': 'Eyes',
  'Nose/Mouth': 'Nose & Mouth', 'Mouth/Face': 'Nose & Mouth', Philtrum: 'Nose & Mouth',
  'Lip Ratio': 'Nose & Mouth', 'Nasal Index': 'Nose & Mouth', 'Nose/Eye W': 'Nose & Mouth', 'Bridge/Alar': 'Nose & Mouth',
  'φ Ratio': 'Harmony', Symmetry: 'Harmony',
};

export const RATIO_GROUPS = [
  { name: 'Face Structure', icon: '🧠' },
  { name: 'Eyes', icon: '👁' },
  { name: 'Nose & Mouth', icon: '👃' },
  { name: 'Harmony', icon: '⚖️' },
];
