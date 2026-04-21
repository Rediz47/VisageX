import type { Landmark, LandmarkArray, SymmetryDetail, SymmetryResult, MetricsResult } from '../types/mediapipe.js';

// Helper functions for geometry
export const dist = (p1: Landmark, p2: Landmark) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
export const angle = (p1: Landmark, p2: Landmark) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

export function calculateEAR(landmarks: LandmarkArray) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const leftEyeInnerEAR = landmarks[133];
    const leftEyeOuterEAR = landmarks[33];

    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const rightEyeInnerEAR = landmarks[362];
    const rightEyeOuterEAR = landmarks[263];

    const leftEAR = dist(leftEyeTop, leftEyeBottom) / dist(leftEyeInnerEAR, leftEyeOuterEAR);
    const rightEAR = dist(rightEyeTop, rightEyeBottom) / dist(rightEyeInnerEAR, rightEyeOuterEAR);

    return { leftEAR, rightEAR };
}

export function alignLandmarks(landmarks: LandmarkArray): LandmarkArray {
    const leftEyeCenter = landmarks[159];
    const rightEyeCenter = landmarks[386];

    const cx = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const cy = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const cz = (leftEyeCenter.z + rightEyeCenter.z) / 2;

    let aligned: LandmarkArray = landmarks.map((p) => ({
        x: p.x - cx,
        y: p.y - cy,
        z: p.z - cz
    }));

    // 1. Roll
    const rollAngle = Math.atan2(aligned[386].y - aligned[159].y, aligned[386].x - aligned[159].x);
    const cosZ = Math.cos(-rollAngle);
    const sinZ = Math.sin(-rollAngle);
    aligned = aligned.map((p) => ({
        x: p.x * cosZ - p.y * sinZ,
        y: p.x * sinZ + p.y * cosZ,
        z: p.z
    }));

    // 2. Yaw
    const yawAngle = Math.atan2(aligned[386].z - aligned[159].z, aligned[386].x - aligned[159].x);
    const cosY = Math.cos(-yawAngle);
    const sinY = Math.sin(-yawAngle);
    aligned = aligned.map((p) => ({
        x: p.x * cosY + p.z * sinY,
        y: p.y,
        z: -p.x * sinY + p.z * cosY
    }));

    // 3. Pitch
    const forehead = aligned[10];
    const chin = aligned[152];
    const pitchAngle = Math.atan2(chin.z - forehead.z, chin.y - forehead.y);
    const cosX = Math.cos(-pitchAngle);
    const sinX = Math.sin(-pitchAngle);
    aligned = aligned.map((p) => ({
        x: p.x,
        y: p.y * cosX - p.z * sinX,
        z: p.y * sinX + p.z * cosX
    }));

    return aligned.map((p) => ({
        x: p.x + cx,
        y: p.y + cy,
        z: p.z + cz
    }));
}

export function analyzeSymmetry(l: LandmarkArray): SymmetryResult {
    const aNoseTip = l[1];
    const midlineX = aNoseTip.x;
    const faceHeight = dist(l[10], l[152]);

    const symmetryPairs = [
        { name: 'Eyes', left: l[33], right: l[263] },
        { name: 'Eyebrows', left: l[105], right: l[334] },
        { name: 'Cheekbones', left: l[234], right: l[454] },
        { name: 'Jawline', left: l[132], right: l[361] },
        { name: 'Mouth', left: l[61], right: l[291] }
    ];

    const detailedSymmetry = symmetryPairs.map(pair => {
        const leftDistX = Math.abs(pair.left.x - midlineX);
        const rightDistX = Math.abs(pair.right.x - midlineX);
        const horizontalSymmetry = Math.min(leftDistX, rightDistX) / Math.max(leftDistX, rightDistX);

        const verticalDiff = Math.abs(pair.left.y - pair.right.y) / faceHeight;
        const verticalSymmetry = Math.max(0, 1 - (verticalDiff * 5));

        const overall = (horizontalSymmetry + verticalSymmetry) / 2;

        let observation = 'Optimal symmetry detected';
        if (horizontalSymmetry < 0.95) {
            observation = leftDistX > rightDistX ? 'Left side appears slightly wider' : 'Right side appears slightly wider';
        } else if (verticalDiff > 0.02) {
            observation = pair.left.y < pair.right.y ? 'Left side is slightly elevated' : 'Right side is slightly elevated';
        }

        return {
            feature: pair.name,
            score: Number((overall * 100).toFixed(1)),
            observation
        };
    });

    const avgSymmetryScore = detailedSymmetry.reduce((acc, curr) => acc + curr.score, 0) / detailedSymmetry.length;
    return { symmetryScore: avgSymmetryScore / 10, detailedSymmetry, avgSymmetryScore };
}

export function calculateMetrics(l: LandmarkArray, symmetryScore: number, detailedSymmetry: SymmetryDetail[]): MetricsResult {
    const leftEyeInner = l[133];
    const leftEyeOuter = l[33];
    const rightEyeInner = l[362];
    const rightEyeOuter = l[263];

    const leftTilt = Math.atan2(leftEyeInner.y - leftEyeOuter.y, leftEyeInner.x - leftEyeOuter.x) * (180 / Math.PI);
    const rightTilt = Math.atan2(rightEyeInner.y - rightEyeOuter.y, rightEyeOuter.x - rightEyeInner.x) * (180 / Math.PI);
    const avgCanthalTilt = (leftTilt + rightTilt) / 2;

    let baseEyeScore = 10 - (Math.abs(6 - avgCanthalTilt) * 0.5);
    baseEyeScore = Math.max(1, Math.min(10, baseEyeScore));

    const eyeSymmetry = detailedSymmetry.find(s => s.feature === 'Eyes')?.score || 100;
    const finalEyeScore = (baseEyeScore + (eyeSymmetry / 10)) / 2;

    const aLeftCheek = l[234];
    const aRightCheek = l[454];
    const faceWidth = dist(aLeftCheek, aRightCheek);
    const upperLip = l[13];
    const eyebrowsMid = { x: (l[107].x + l[336].x) / 2, y: (l[107].y + l[336].y) / 2 };
    const midFaceHeight = Math.abs(upperLip.y - eyebrowsMid.y);
    const fWHR = faceWidth / midFaceHeight;

    let fwhrScore = 10 - (Math.abs(1.85 - fWHR) * 3);
    fwhrScore = Math.max(1, Math.min(10, fwhrScore));

    const aLeftJaw = l[132];
    const aRightJaw = l[361];
    const jawWidth = dist(aLeftJaw, aRightJaw);
    const cheekToJawRatio = faceWidth / jawWidth;

    let baseJawScore = 10 - (Math.abs(1.25 - cheekToJawRatio) * 8);
    baseJawScore = Math.max(1, Math.min(10, baseJawScore));

    const jawSymmetry = detailedSymmetry.find(s => s.feature === 'Jawline')?.score || 100;
    const finalJawScore = (baseJawScore + (jawSymmetry / 10)) / 2;

    const faceHeight = dist(l[10], l[152]);
    const heightToWidthRatio = faceHeight / faceWidth;

    let proportionsScore = 10 - (Math.abs(1.618 - heightToWidthRatio) * 5);
    proportionsScore = Math.max(1, Math.min(10, proportionsScore));

    // ── Extended metrics ───────────────────────────────────────────────
    // Brow line Y (inner brows)
    const browInnerY = (l[105].y + l[334].y) / 2;
    // Nose base (landmark 94 = under-nose / base of columella)
    const noseBaseY = l[94]?.y ?? l[2].y;
    // Midface height = brow line to nose base
    const midfaceHeight2 = Math.abs(noseBaseY - browInnerY);
    const midfaceRatio = midfaceHeight2 / faceHeight;   // ideal ≈ 0.30–0.33

    // Lower face height = nose base to chin
    const lowerFaceHeight = Math.abs(l[152].y - noseBaseY);
    const lowerFaceRatio = lowerFaceHeight / faceHeight; // ideal ≈ 0.33

    // Upper face height = top of head to brow line
    const upperFaceHeight = Math.abs(browInnerY - l[10].y);
    const upperFaceRatio = upperFaceHeight / faceHeight;

    // Eye spacing — interocular (inner corner gap) vs face width
    const interocularDist = Math.abs(l[362].x - l[133].x);
    const eyeSpacingRatio = interocularDist / faceWidth; // ideal ≈ 0.30–0.36

    // Each eye width
    const leftEyeWidth = dist(l[33], l[133]);
    const rightEyeWidth = dist(l[263], l[362]);
    const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
    // Palpebral fissure ratio: eye width vs face width (ideal ≈ 0.19–0.23 per eye)
    const palpebralRatio = avgEyeWidth / faceWidth;

    // Chin projection — horizontal offset of chin vs nose tip along face midline
    const noseTipX = l[1].x;
    const chinX = l[152].x;
    const chinProjection = Math.abs(chinX - noseTipX) / faceWidth; // > 0.05 = recessed

    // Nose width — alar width via landmarks 98 and 327
    const noseLeft = l[98]?.x ?? l[64]?.x ?? (l[1].x - faceWidth * 0.07);
    const noseRight = l[327]?.x ?? l[294]?.x ?? (l[1].x + faceWidth * 0.07);
    const noseWidth = Math.abs(noseRight - noseLeft);
    const noseWidthRatio = noseWidth / faceWidth; // ideal ≈ 0.22–0.28

    // Mouth width vs face width
    const mouthWidth = dist(l[61], l[291]);
    const mouthWidthRatio = mouthWidth / faceWidth; // ideal ≈ 0.38–0.46

    // Lip-to-chin distance vs lower face height
    const lowerLip = l[17]?.y ?? l[152].y - lowerFaceHeight * 0.4;
    const lipToChinHeight = Math.abs(l[152].y - lowerLip);
    const lipChinRatio = lipToChinHeight / lowerFaceHeight; // ideal ≈ 0.35–0.45

    // Facial thirds imbalance (compare upper vs lower third)
    const thirdsRatio = upperFaceHeight / (lowerFaceHeight || 1);

    const overallScore = (symmetryScore + finalEyeScore + finalJawScore + proportionsScore + fwhrScore) / 5;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // ── Symmetry ──────────────────────────────────────────────────────
    if (symmetryScore >= 8.5) strengths.push('Excellent facial symmetry');
    else if (symmetryScore >= 7.5) strengths.push('Good facial symmetry');
    else if (symmetryScore < 7) weaknesses.push('Noticeable facial asymmetry');

    // ── Canthal tilt ──────────────────────────────────────────────────
    if (avgCanthalTilt > 5 && avgCanthalTilt < 12) strengths.push(`Sharp positive canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);
    else if (avgCanthalTilt > 2) strengths.push(`Positive canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);
    else if (avgCanthalTilt <= 0) weaknesses.push(`Negative or neutral canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);
    else if (avgCanthalTilt <= 2) weaknesses.push(`Below-average canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);

    // ── fWHR ──────────────────────────────────────────────────────────
    if (fWHR >= 1.75 && fWHR <= 1.95) strengths.push(`Ideal facial width-to-height ratio (${fWHR.toFixed(2)})`);
    else if (fWHR < 1.6) weaknesses.push(`Narrow face structure (Low fWHR: ${fWHR.toFixed(2)})`);
    else if (fWHR < 1.7) weaknesses.push('Face is slightly narrow (Low fWHR)');
    else if (fWHR > 2.1) weaknesses.push('Face appears disproportionately wide (High fWHR)');

    // ── Jawline ───────────────────────────────────────────────────────
    if (cheekToJawRatio >= 1.2 && cheekToJawRatio <= 1.35) strengths.push('Strong, well-proportioned jawline');
    else if (cheekToJawRatio > 1.5) weaknesses.push('Very narrow jawline relative to cheekbones');
    else if (cheekToJawRatio > 1.4) weaknesses.push('Jawline is narrow compared to cheekbones');
    else if (cheekToJawRatio < 1.1) weaknesses.push('Overly square jawline — unfavorable cheek-to-jaw ratio');

    // ── Golden Ratio / Proportions ────────────────────────────────────
    if (Math.abs(1.618 - heightToWidthRatio) < 0.08) strengths.push('Excellent Golden Ratio proportions');
    else if (Math.abs(1.618 - heightToWidthRatio) > 0.25) weaknesses.push('Face shape deviates significantly from the Golden Ratio');

    // ── Midface ratio ─────────────────────────────────────────────────
    if (midfaceRatio > 0.36) weaknesses.push('Long midface — elongated middle facial third');
    else if (midfaceRatio > 0.34) weaknesses.push('Slightly elevated midface ratio');
    else if (midfaceRatio < 0.28) strengths.push('Compact midface ratio');

    // ── Lower face ────────────────────────────────────────────────────
    if (lowerFaceRatio > 0.38) weaknesses.push('Long lower face — disproportionate chin-to-nose distance');
    else if (lowerFaceRatio < 0.28) weaknesses.push('Short lower face — compressed chin projection');
    else if (lowerFaceRatio >= 0.31 && lowerFaceRatio <= 0.36) strengths.push('Balanced lower face ratio');

    // ── Facial thirds ─────────────────────────────────────────────────
    if (thirdsRatio < 0.75) weaknesses.push('Unbalanced facial thirds — lower face dominates');
    else if (thirdsRatio > 1.4) weaknesses.push('High forehead — upper third disproportionately large');

    // ── Eye spacing ───────────────────────────────────────────────────
    if (eyeSpacingRatio >= 0.29 && eyeSpacingRatio <= 0.36) strengths.push('Ideal eye spacing');
    else if (eyeSpacingRatio < 0.27) weaknesses.push('Close-set eyes — below-ideal interocular distance');
    else if (eyeSpacingRatio > 0.38) weaknesses.push('Wide-set eyes — above-ideal interocular distance');

    // ── Palpebral fissure (eye size) ──────────────────────────────────
    if (palpebralRatio >= 0.19 && palpebralRatio <= 0.24) strengths.push('Well-proportioned eye aperture');
    else if (palpebralRatio < 0.16) weaknesses.push('Small palpebral fissure — eyes appear smaller than ideal');

    // ── Nose width ────────────────────────────────────────────────────
    if (noseWidthRatio > 0.30) weaknesses.push('Wide nasal base — alar width exceeds ideal proportions');
    else if (noseWidthRatio < 0.20) weaknesses.push('Narrow nasal base — nose appears pinched relative to face');

    // ── Mouth / lips ──────────────────────────────────────────────────
    if (mouthWidthRatio >= 0.38 && mouthWidthRatio <= 0.46) strengths.push('Ideal mouth width proportions');
    else if (mouthWidthRatio < 0.34) weaknesses.push('Narrow mouth width — lips appear compressed relative to face');
    else if (mouthWidthRatio > 0.50) weaknesses.push('Wide mouth — horizontal lip span exceeds facial ideal');

    // ── Chin projection ───────────────────────────────────────────────
    if (chinProjection > 0.06) weaknesses.push('Recessed chin — reduced forward projection reduces lower-face definition');

    // ── Symmetry details ──────────────────────────────────────────────
    const jawSymmetryDetail = detailedSymmetry.find((s) => s.feature === 'Jawline');
    if (jawSymmetryDetail && jawSymmetryDetail.score < 75) weaknesses.push('Jaw asymmetry — lateral jaw landmark deviation detected');

    const eyeSymmetryDetail = detailedSymmetry.find((s) => s.feature === 'Eyes');
    if (eyeSymmetryDetail && eyeSymmetryDetail.score < 75) weaknesses.push('Eye-level asymmetry — orbital height imbalance detected');

    const cheekSymmetryDetail = detailedSymmetry.find((s) => s.feature === 'Cheekbones');
    if (cheekSymmetryDetail && cheekSymmetryDetail.score < 75) weaknesses.push('Cheekbone asymmetry — lateral midface imbalance detected');

    if (strengths.length === 0) strengths.push('Balanced overall features');
    if (weaknesses.length === 0) weaknesses.push('No major structural weaknesses detected');

    return {
        overallScore,
        finalEyeScore,
        finalJawScore,
        proportionsScore,
        fwhrScore,
        avgCanthalTilt,
        fWHR,
        heightToWidthRatio,
        midfaceRatio,
        lowerFaceRatio,
        eyeSpacingRatio,
        noseWidthRatio,
        mouthWidthRatio,
        strengths,
        weaknesses
    };
}
