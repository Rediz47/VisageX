import { Router } from 'express';
import { calculateEAR, alignLandmarks, analyzeSymmetry, calculateMetrics } from '../utils/geometry.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const { landmarks } = req.body;

    if (!landmarks || landmarks.length === 0) {
      return res.status(400).json({ error: 'No landmarks provided' });
    }

    // --- 1. PHOTO QUALITY CHECKS ---
    const { leftEAR, rightEAR } = calculateEAR(landmarks);
    if (leftEAR < 0.15 || rightEAR < 0.15) {
      return res.status(400).json({
        error: 'Eyes appear to be closed or squinting. Please open your eyes normally.'
      });
    }

    // --- 2. 3D FACE ALIGNMENT ---
    const alignedLandmarks = alignLandmarks(landmarks);

    // --- 3. ANALYZE SYMMETRY ---
    const { symmetryScore, detailedSymmetry, avgSymmetryScore } = analyzeSymmetry(alignedLandmarks);

    // --- 4. CALCULATE METRICS & FINAL SCORE ---
    const result = calculateMetrics(alignedLandmarks, symmetryScore, detailedSymmetry);

    return res.json({
      overallScore: Number(result.overallScore.toFixed(1)),
      breakdown: {
        Eyes: Number(result.finalEyeScore.toFixed(1)),
        Jawline: Number(result.finalJawScore.toFixed(1)),
        Symmetry: Number(symmetryScore.toFixed(1)),
        Proportions: Number(result.proportionsScore.toFixed(1)),
        Dimorphism: Number(result.fwhrScore.toFixed(1))
      },
      metrics: {
        facialSymmetry: Number(avgSymmetryScore.toFixed(1)) + '%',
        canthalTilt: Number(result.avgCanthalTilt.toFixed(2)) + '°',
        fWHR: Number(result.fWHR.toFixed(2)),
        goldenRatio: Number(result.heightToWidthRatio.toFixed(3))
      },
      detailedSymmetry,
      analysis: {
        strengths: result.strengths,
        weaknesses: result.weaknesses
      }
    });
  } catch (error: any) {
    console.error('Error analyzing face geometry:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze face geometry',
      message: error.message || 'An unexpected error occurred during geometric analysis'
    });
  }
});

export default router;
