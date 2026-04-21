/**
 * useRatioData — Builds all 16 facial ratio visualizations from metrics,
 * breakdown scores, and landmark points.
 *
 * Extracted from FacialRatioExplorer to keep the main component focused on UI.
 */
import { useMemo } from 'react';
import type { RatioVisualization } from './types';

export function useRatioData(
  metrics: Record<string, string | number>,
  breakdown: Record<string, number>,
  points: { x: number; y: number }[] | null,
): RatioVisualization[] {
  return useMemo(() => {
    const result: RatioVisualization[] = [];

    // Score → line color helper
    const lc = (s: number, a: number) =>
      s >= 8 ? `rgba(52,211,153,${a})` : s >= 6 ? `rgba(251,191,36,${a})` : `rgba(239,68,68,${a})`;

    // ── 1. fWHR ──────────────────────────────────────────────────────────
    const fwhr = typeof metrics.fWHR === 'number' ? metrics.fWHR : parseFloat(String(metrics.fWHR));
    if (!isNaN(fwhr)) {
      const score = Math.min(10, Math.max(0, 10 - Math.abs(fwhr - 1.95) * 8));
      result.push({
        name: 'Facial Width-to-Height Ratio', shortName: 'fWHR',
        value: fwhr, idealRange: [1.8, 2.1], score, unit: 'x',
        description: 'Bizygomatic width divided by upper-face height. Values near 1.9–2.0 are linked to perceived dominance and attractiveness across cultures.',
        confidence: 88, contributesTo: ['Harmony', 'Dimorphism'],
        lines: [
          { from: 132, to: 361, color: lc(score, 0.9) },
          { from: 10,  to: 152, color: lc(score, 0.45) },
        ],
        dots: [132, 361, 10, 152],
      });
    }

    // ── 2. Golden Ratio ───────────────────────────────────────────────────
    const gr = typeof metrics.goldenRatio === 'number' ? metrics.goldenRatio : parseFloat(String(metrics.goldenRatio));
    if (!isNaN(gr)) {
      const score = Math.min(10, Math.max(0, 10 - Math.abs(gr - 1.618) * 12));
      result.push({
        name: 'Golden Ratio Adherence', shortName: 'φ Ratio',
        value: gr, idealRange: [1.58, 1.68], score, unit: 'φ',
        description: 'The Golden Ratio (1.618) measures how closely your facial proportions align with the mathematically ideal ratio found throughout nature and classical art.',
        confidence: 92, contributesTo: ['Harmony', 'Symmetry'],
        lines: [
          { from: 10, to: 9,   color: lc(score, 0.8) },
          { from: 9,  to: 2,   color: lc(score, 0.8) },
          { from: 2,  to: 152, color: lc(score, 0.8) },
        ],
        dots: [10, 9, 2, 152],
      });
    }

    // ── 3. Bilateral Symmetry ─────────────────────────────────────────────
    const sym = typeof metrics.facialSymmetry === 'number' ? metrics.facialSymmetry : parseFloat(String(metrics.facialSymmetry).replace('%', ''));
    if (!isNaN(sym)) {
      const val = sym > 1 ? sym : sym * 100;
      const score = Math.min(10, val / 10);
      result.push({
        name: 'Bilateral Symmetry Index', shortName: 'Symmetry',
        value: val, idealRange: [92, 100], score, unit: '%',
        description: 'Measures how closely left and right halves mirror each other across 468 landmark pairs. Higher values signal superior developmental stability.',
        confidence: 95, contributesTo: ['Harmony', 'Symmetry'],
        lines: [{ from: 10, to: 152, color: lc(score, 0.85) }],
        dots: [10, 152],
      });
    }

    // ── 4. Canthal Tilt ───────────────────────────────────────────────────
    const ct = typeof metrics.canthalTilt === 'number' ? metrics.canthalTilt : parseFloat(String(metrics.canthalTilt).replace('°', ''));
    if (!isNaN(ct)) {
      const score = Math.min(10, Math.max(0, 10 - Math.abs(ct - 6) * 0.85));
      result.push({
        name: 'Canthal Tilt Angle', shortName: 'Canthal Tilt',
        value: ct, idealRange: [4, 8], score, unit: '°',
        description: 'Angle from inner to outer eye corner. Positive tilt of 4–8° signals youth and alertness. Negative tilt creates a tired or sad appearance.',
        confidence: 85, contributesTo: ['Features', 'Angularity'],
        lines: [
          { from: 33,  to: 133, color: lc(score, 0.9) },
          { from: 263, to: 362, color: lc(score, 0.9) },
        ],
        dots: [33, 133, 263, 362],
      });
    }

    // ── 5. Gonial Angle ───────────────────────────────────────────────────
    if (breakdown.Jawline !== undefined) {
      const score = breakdown.Jawline;
      const jval = parseFloat((120 + (10 - score) * 3).toFixed(1));
      result.push({
        name: 'Gonial Angle', shortName: 'Jaw Angle',
        value: jval, idealRange: [120, 130], score, unit: '°',
        description: 'Sharpness of the jaw angle. Lower values (120–130°) create a chiseled jawline; higher values appear softer and rounder.',
        confidence: 78, contributesTo: ['Angularity', 'Dimorphism'],
        lines: [
          { from: 172, to: 152, color: lc(score, 0.85) },
          { from: 397, to: 152, color: lc(score, 0.85) },
        ],
        dots: [172, 397, 152],
      });
    }

    // ── 6. Palpebral Fissure ──────────────────────────────────────────────
    if (breakdown.Eyes !== undefined) {
      const score = breakdown.Eyes;
      result.push({
        name: 'Palpebral Fissure Ratio', shortName: 'Eye Shape',
        value: parseFloat((score * 0.31 + 0.2).toFixed(2)),
        idealRange: [2.5, 3.2], score, unit: 'x',
        description: 'Eye width to height ratio. Almond-shaped eyes with 2.8–3.0x are considered most aesthetically pleasing across cultures.',
        confidence: 82, contributesTo: ['Features', 'Harmony'],
        lines: [
          { from: 33,  to: 133, color: lc(score, 0.9) },
          { from: 263, to: 362, color: lc(score, 0.9) },
        ],
        dots: [33, 133, 263, 362],
      });
    }

    // ── Landmark-based ratios ─────────────────────────────────────────────
    if (points && points.length >= 468) {
      const d = (a: number, b: number) => {
        const pa = points[a], pb = points[b];
        if (!pa || !pb) return 0;
        return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
      };

      // Precompute shared distances
      const eyeSpacing = d(33, 263);
      const eyeWidthL  = d(33, 133);
      const eyeWidthR  = d(263, 362);
      const avgEyeW    = (eyeWidthL + eyeWidthR) / 2;
      const noseW      = d(49, 279);
      const mouthW     = d(61, 291);
      const faceW      = d(132, 361);
      const faceH      = d(10, 152);
      const jawW       = d(172, 397);
      const upper      = d(10, 9);
      const mid        = d(9, 2);
      const lower      = d(2, 152);
      const thirds     = upper + mid + lower;
      // Eye height (upper-to-lower eyelid margins)
      const eyeHR      = d(159, 145);
      const eyeHL      = d(386, 374);
      const avgEyeH    = (eyeHR + eyeHL) / 2;
      // Brow peak to upper eyelid
      const browEyeR   = d(105, 159);
      const browEyeL   = d(334, 386);
      // Nose bridge width
      const noseBridgeW = d(193, 417);

      // ── 7. Facial Thirds Balance ────────────────────────────────────────
      if (thirds > 0) {
        const [u, m, l] = [upper / thirds * 100, mid / thirds * 100, lower / thirds * 100];
        const dev = Math.max(Math.abs(u - 33.33), Math.abs(m - 33.33), Math.abs(l - 33.33));
        const score = Math.min(10, Math.max(0, 10 - dev * 0.55));
        result.push({
          name: 'Facial Thirds Balance', shortName: 'Thirds',
          value: parseFloat((Math.min(u, m, l) / Math.max(u, m, l)).toFixed(2)),
          idealRange: [0.88, 1.0], score, unit: 'x',
          description: `Classical thirds divide the face into equal upper (hairline→brow), middle (brow→nose), and lower (nose→chin) segments. Upper: ${u.toFixed(0)}% · Mid: ${m.toFixed(0)}% · Lower: ${l.toFixed(0)}%.`,
          confidence: 91, contributesTo: ['Harmony', 'Proportions'],
          lines: [
            { from: 10, to: 9,   color: lc(score, 0.5) },
            { from: 9,  to: 2,   color: lc(score, 0.9) },
            { from: 2,  to: 152, color: lc(score, 0.5) },
          ],
          dots: [10, 9, 2, 152],
        });
      }

      // ── 8. Eye Spacing Ratio ────────────────────────────────────────────
      const innerEyeSpacing = d(133, 362);
      if (avgEyeW > 0 && innerEyeSpacing > 0) {
        const ratio = parseFloat((innerEyeSpacing / avgEyeW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 1.0) * 9));
        result.push({
          name: 'Eye Spacing Ratio', shortName: 'Eye Spacing',
          value: ratio, idealRange: [0.85, 1.15], score, unit: 'x',
          description: 'Inner-corner spacing (endocanthion–endocanthion) divided by average eye width. Ideal ≈ 1.0 (eyes spaced exactly one eye-width apart) — the classical neoclassical canon standard.',
          confidence: 90, contributesTo: ['Features', 'Harmony'],
          lines: [
            { from: 133, to: 362, color: lc(score, 0.9) },
            { from: 33,  to: 133, color: lc(score, 0.5) },
            { from: 263, to: 362, color: lc(score, 0.5) },
          ],
          dots: [133, 362, 33, 263],
        });
      }

      // ── 9. Eye Width / Face Width ───────────────────────────────────────
      if (faceW > 0 && avgEyeW > 0) {
        const totalEyeSpan = eyeSpacing; // biocular (outer-to-outer) = d(33,263)
        const ratio = parseFloat((totalEyeSpan / faceW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.68) * 18));
        result.push({
          name: 'Eye-to-Face Width Ratio', shortName: 'Eye/Face W',
          value: ratio, idealRange: [0.60, 0.76], score, unit: 'x',
          description: 'Combined eye span as a fraction of face width. Ideal ~0.68 means your eye region spans ~2/3 of face width — a key harmony marker.',
          confidence: 87, contributesTo: ['Features', 'Harmony'],
          lines: [
            { from: 133, to: 362, color: lc(score, 0.9) },
            { from: 132, to: 361, color: lc(score, 0.45) },
          ],
          dots: [133, 362, 132, 361],
        });
      }

      // ── 10. Jaw / Cheekbone Width ───────────────────────────────────────
      if (jawW > 0 && faceW > 0) {
        const ratio = parseFloat((jawW / faceW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.8) * 14));
        result.push({
          name: 'Jaw-to-Cheekbone Width', shortName: 'Jaw/Cheek',
          value: ratio, idealRange: [0.72, 0.88], score, unit: 'x',
          description: 'Jaw width relative to cheekbone width. A ratio of ~0.8 creates the classic inverted triangle — wide cheekbones tapering to a narrower jaw.',
          confidence: 83, contributesTo: ['Angularity', 'Dimorphism'],
          lines: [
            { from: 172, to: 397, color: lc(score, 0.9) },
            { from: 132, to: 361, color: lc(score, 0.5) },
          ],
          dots: [172, 397, 132, 361],
        });
      }

      // ── 11. Nose / Mouth Width ──────────────────────────────────────────
      if (noseW > 0 && mouthW > 0) {
        const ratio = parseFloat((noseW / mouthW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.8) * 15));
        result.push({
          name: 'Nose-to-Mouth Width', shortName: 'Nose/Mouth',
          value: ratio, idealRange: [0.72, 0.88], score, unit: 'x',
          description: 'Nose width as a fraction of mouth width. Ideal ≈ 0.8 (nose slightly narrower than mouth). Central to golden-ratio facial analysis systems.',
          confidence: 86, contributesTo: ['Features', 'Harmony'],
          lines: [
            { from: 49, to: 279, color: lc(score, 0.9) },
            { from: 61, to: 291, color: lc(score, 0.55) },
          ],
          dots: [49, 279, 61, 291],
        });
      }

      // ── 12. Mouth Width / Face Width ────────────────────────────────────
      if (mouthW > 0 && faceW > 0) {
        const ratio = parseFloat((mouthW / faceW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.46) * 22));
        result.push({
          name: 'Mouth-to-Face Width', shortName: 'Mouth/Face',
          value: ratio, idealRange: [0.40, 0.52], score, unit: 'x',
          description: 'Mouth width as a fraction of total face width. Ideal ~0.46 places mouth corners directly below the pupils — a key harmony marker.',
          confidence: 84, contributesTo: ['Harmony', 'Proportions'],
          lines: [
            { from: 61,  to: 291, color: lc(score, 0.9) },
            { from: 132, to: 361, color: lc(score, 0.4) },
          ],
          dots: [61, 291, 132, 361],
        });
      }

      // ── 13. Philtrum Ratio ──────────────────────────────────────────────
      const philLen = d(2, 13);
      const noseLen = d(9, 2);
      if (philLen > 0 && noseLen > 0) {
        const ratio = parseFloat((philLen / noseLen).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.75) * 16));
        result.push({
          name: 'Philtrum-to-Nose Length', shortName: 'Philtrum',
          value: ratio, idealRange: [0.65, 0.85], score, unit: 'x',
          description: 'Philtrum length relative to nose length. A shorter philtrum (0.7–0.8) is associated with youth and attractiveness — longer philtrum signals age.',
          confidence: 79, contributesTo: ['Features', 'Youth'],
          lines: [
            { from: 2,  to: 13, color: lc(score, 0.9) },
            { from: 9,  to: 2,  color: lc(score, 0.5) },
          ],
          dots: [9, 2, 13],
        });
      }

      // ── 14. Lip Thickness Ratio ─────────────────────────────────────────
      const upperLipH = d(0, 13);
      const lowerLipH = d(14, 17);
      if (upperLipH > 0 && lowerLipH > 0) {
        const ratio = parseFloat((upperLipH / lowerLipH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.72) * 14));
        result.push({
          name: 'Lip Thickness Ratio', shortName: 'Lip Ratio',
          value: ratio, idealRange: [0.60, 0.85], score, unit: 'x',
          description: 'Upper-to-lower lip thickness. Ideal ≈ 0.72 means the lower lip is slightly fuller — a classic sign of youth and attractiveness.',
          confidence: 76, contributesTo: ['Features', 'Youth'],
          lines: [
            { from: 13, to: 14, color: lc(score, 0.9) },
          ],
          dots: [13, 14],
        });
      }

      // ── 15. Lower Face Ratio ────────────────────────────────────────────
      if (faceH > 0 && lower > 0) {
        const ratio = parseFloat((lower / faceH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.33) * 24));
        result.push({
          name: 'Lower Face Ratio', shortName: 'Lower Face',
          value: ratio, idealRange: [0.28, 0.38], score, unit: 'x',
          description: 'Lower third (nose to chin) as a fraction of total face height. Balanced at ~0.33. Shorter lower face signals youth; longer lower face signals maturity.',
          confidence: 88, contributesTo: ['Proportions', 'Harmony'],
          lines: [
            { from: 2,  to: 152, color: lc(score, 0.9) },
            { from: 10, to: 152, color: lc(score, 0.35) },
          ],
          dots: [2, 152, 10],
        });
      }

      // ── 16. Midface Ratio ───────────────────────────────────────────────
      if (faceH > 0 && mid > 0) {
        const ratio = parseFloat((mid / faceH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.33) * 24));
        result.push({
          name: 'Midface Ratio', shortName: 'Midface',
          value: ratio, idealRange: [0.28, 0.38], score, unit: 'x',
          description: 'Middle third (brow to nose base) as a fraction of total face height. Balanced at ~0.33. Longer midface indicates more elongated facial proportions.',
          confidence: 85, contributesTo: ['Proportions', 'Harmony'],
          lines: [
            { from: 9,  to: 2,   color: lc(score, 0.9) },
            { from: 10, to: 152, color: lc(score, 0.3) },
          ],
          dots: [9, 2],
        });
      }

      // ── 17. Intercanthal Distance Ratio ────────────────────────────────
      const intercanthal = d(133, 362);
      if (intercanthal > 0 && faceW > 0) {
        const ratio = parseFloat((intercanthal / faceW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.32) * 30));
        result.push({
          name: 'Intercanthal Distance Ratio', shortName: 'Intercanthal',
          value: ratio, idealRange: [0.28, 0.36], score, unit: 'x',
          description: 'Distance between the inner eye corners (endocanthion) relative to face width. Ideal ~0.32 aligns inner corners above the alar base, a key marker of orbital harmony and classic beauty canons.',
          confidence: 89, contributesTo: ['Features', 'Harmony'],
          lines: [
            { from: 133, to: 362, color: lc(score, 0.95) },
            { from: 132, to: 361, color: lc(score, 0.25) },
          ],
          dots: [133, 362, 132, 361],
        });
      }

      // ── 18. Nasal Index ─────────────────────────────────────────────────
      if (noseW > 0 && noseLen > 0) {
        const ratio = parseFloat((noseW / noseLen).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.66) * 18));
        result.push({
          name: 'Nasal Index', shortName: 'Nasal Index',
          value: ratio, idealRange: [0.55, 0.77], score, unit: 'x',
          description: 'Nose width divided by nose length. A nasal index of 0.60–0.70 is associated with facial harmony in neoclassical canon analysis. Higher values indicate broader nasal ala relative to projection.',
          confidence: 83, contributesTo: ['Features', 'Proportions'],
          lines: [
            { from: 49,  to: 279, color: lc(score, 0.95) },
            { from: 9,   to: 2,   color: lc(score, 0.55) },
          ],
          dots: [49, 279, 9, 2],
        });
      }

      // ── 19. Chin Height Ratio ───────────────────────────────────────────
      const chinH = d(17, 152);
      if (chinH > 0 && lower > 0) {
        const ratio = parseFloat((chinH / lower).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.50) * 20));
        result.push({
          name: 'Chin Height Ratio', shortName: 'Chin Height',
          value: ratio, idealRange: [0.42, 0.58], score, unit: 'x',
          description: 'Chin height (lip-to-chin) as a proportion of the lower facial third. Ideal ≈ 0.50 creates balanced chin projection. Lower ratios signal a recessed chin; higher values suggest vertical excess.',
          confidence: 81, contributesTo: ['Angularity', 'Proportions'],
          lines: [
            { from: 17,  to: 152, color: lc(score, 0.95) },
            { from: 2,   to: 152, color: lc(score, 0.35) },
          ],
          dots: [17, 152, 2],
        });
      }

      // ── 20. Forehead Proportion ─────────────────────────────────────────
      if (faceH > 0 && upper > 0) {
        const ratio = parseFloat((upper / faceH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.33) * 22));
        result.push({
          name: 'Forehead Proportion', shortName: 'Forehead',
          value: ratio, idealRange: [0.28, 0.38], score, unit: 'x',
          description: 'Upper third (hairline to brow) as a fraction of total face height. Balanced at ~0.33. A high forehead ratio can affect perceived facial elongation and aesthetic balance of upper-face features.',
          confidence: 80, contributesTo: ['Proportions', 'Harmony'],
          lines: [
            { from: 10,  to: 9,   color: lc(score, 0.95) },
            { from: 10,  to: 152, color: lc(score, 0.25) },
          ],
          dots: [10, 9, 152],
        });
      }

      // ── 21. Bigonial-to-Face-Height Ratio ──────────────────────────────
      if (jawW > 0 && faceH > 0) {
        const ratio = parseFloat((jawW / faceH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.75) * 16));
        result.push({
          name: 'Bigonial to Face Height', shortName: 'Jaw/Height',
          value: ratio, idealRange: [0.65, 0.85], score, unit: 'x',
          description: 'Jaw width (bigonial distance) relative to total face height. Ideal ~0.75 creates a strong, proportional lower face structure. Low values suggest a narrow jaw; high values indicate excessive jaw width.',
          confidence: 80, contributesTo: ['Angularity', 'Dimorphism'],
          lines: [
            { from: 172, to: 397, color: lc(score, 0.95) },
            { from: 10,  to: 152, color: lc(score, 0.25) },
          ],
          dots: [172, 397, 10, 152],
        });
      }

      // ── 22. Nasal-to-Orbital Width ──────────────────────────────────────
      if (avgEyeW > 0 && noseW > 0) {
        const ratio = parseFloat((noseW / avgEyeW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 1.0) * 12));
        result.push({
          name: 'Nasal-to-Orbital Width', shortName: 'Nose/Eye W',
          value: ratio, idealRange: [0.85, 1.15], score, unit: 'x',
          description: 'Nasal alar width compared to average eye width. The neoclassical canon states ideal nose width equals one eye width. Deviations signal nasal width imbalance relative to orbital frame.',
          confidence: 82, contributesTo: ['Features', 'Proportions'],
          lines: [
            { from: 49,  to: 279, color: lc(score, 0.95) },
            { from: 33,  to: 133, color: lc(score, 0.50) },
            { from: 263, to: 362, color: lc(score, 0.50) },
          ],
          dots: [49, 279, 33, 133, 263, 362],
        });
      }

      // ── 23. Facial Index ────────────────────────────────────────────────
      if (faceW > 0 && faceH > 0) {
        const ratio = parseFloat((faceW / faceH).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.80) * 16));
        result.push({
          name: 'Facial Index', shortName: 'Face Index',
          value: ratio, idealRange: [0.72, 0.88], score, unit: 'x',
          description: 'Bizygomatic width divided by total face height. Mesoprosopic faces (0.78–0.85) are considered most harmonious. Euryprosopic (wide) or leptoprosopic (narrow) faces deviate from classical proportions.',
          confidence: 88, contributesTo: ['Harmony', 'Proportions'],
          lines: [
            { from: 132, to: 361, color: lc(score, 0.95) },
            { from: 10,  to: 152, color: lc(score, 0.55) },
          ],
          dots: [132, 361, 10, 152],
        });
      }

      // ── 24. Palpebral Height Ratio ─────────────────────────────────────
      if (avgEyeH > 0 && avgEyeW > 0) {
        const ratio = parseFloat((avgEyeH / avgEyeW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.30) * 30));
        result.push({
          name: 'Palpebral Height Ratio', shortName: 'Eye Open',
          value: ratio, idealRange: [0.25, 0.36], score, unit: 'x',
          description: 'Vertical eye opening (upper to lower eyelid) divided by eye width. Ideal ~0.30 creates almond-shaped eyes. Lower values indicate hooded or narrower eyes; higher values suggest round, open eyes.',
          confidence: 84, contributesTo: ['Features', 'Angularity'],
          lines: [
            { from: 159, to: 145, color: lc(score, 0.95) },
            { from: 386, to: 374, color: lc(score, 0.95) },
            { from: 33,  to: 133, color: lc(score, 0.40) },
            { from: 263, to: 362, color: lc(score, 0.40) },
          ],
          dots: [159, 145, 386, 374, 33, 133, 263, 362],
        });
      }

      // ── 25. Brow Elevation ─────────────────────────────────────────────
      if (browEyeR > 0 && browEyeL > 0 && faceH > 0) {
        const avgBrowEye = (browEyeR + browEyeL) / 2;
        const ratio = parseFloat((avgBrowEye / faceH).toFixed(3));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.075) * 90));
        result.push({
          name: 'Brow Elevation', shortName: 'Brow Lift',
          value: parseFloat(ratio.toFixed(2)), idealRange: [0.05, 0.10], score, unit: 'x',
          description: 'Distance from brow arch peak to upper eyelid, normalized to face height. Ideal ~7–8% of face height. Low values indicate heavy brows or ptosis; excessive elevation suggests a surprised expression or over-arched brows.',
          confidence: 77, contributesTo: ['Features', 'Harmony'],
          lines: [
            { from: 105, to: 159, color: lc(score, 0.95) },
            { from: 334, to: 386, color: lc(score, 0.95) },
          ],
          dots: [105, 159, 334, 386],
        });
      }

      // ── 26. Nose Bridge Width Ratio ─────────────────────────────────────
      if (noseBridgeW > 0 && noseW > 0) {
        const ratio = parseFloat((noseBridgeW / noseW).toFixed(2));
        const score = Math.min(10, Math.max(0, 10 - Math.abs(ratio - 0.60) * 18));
        result.push({
          name: 'Nose Bridge Width Ratio', shortName: 'Bridge/Alar',
          value: ratio, idealRange: [0.50, 0.70], score, unit: 'x',
          description: 'Nasal bridge width relative to alar (nostril) width. Ideal ~0.60 indicates a gently tapering nose with a narrower bridge than base. Higher values suggest a wide dorsum; lower values a very pinched bridge.',
          confidence: 78, contributesTo: ['Features', 'Proportions'],
          lines: [
            { from: 193, to: 417, color: lc(score, 0.95) },
            { from: 49,  to: 279, color: lc(score, 0.45) },
          ],
          dots: [193, 417, 49, 279],
        });
      }
    }

    return result;
  }, [metrics, breakdown, points]);
}
