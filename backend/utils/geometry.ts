// Helper functions for geometry
export const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
export const angle = (p1: any, p2: any) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

export function calculateEAR(landmarks: any[]) {
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

export function alignLandmarks(landmarks: any[]) {
    const leftEyeCenter = landmarks[159];
    const rightEyeCenter = landmarks[386];

    const cx = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const cy = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const cz = (leftEyeCenter.z + rightEyeCenter.z) / 2;

    let aligned = landmarks.map((p: any) => ({
        x: p.x - cx,
        y: p.y - cy,
        z: p.z - cz
    }));

    // 1. Roll
    const rollAngle = Math.atan2(aligned[386].y - aligned[159].y, aligned[386].x - aligned[159].x);
    const cosZ = Math.cos(-rollAngle);
    const sinZ = Math.sin(-rollAngle);
    aligned = aligned.map((p: any) => ({
        x: p.x * cosZ - p.y * sinZ,
        y: p.x * sinZ + p.y * cosZ,
        z: p.z
    }));

    // 2. Yaw
    const yawAngle = Math.atan2(aligned[386].z - aligned[159].z, aligned[386].x - aligned[159].x);
    const cosY = Math.cos(-yawAngle);
    const sinY = Math.sin(-yawAngle);
    aligned = aligned.map((p: any) => ({
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
    aligned = aligned.map((p: any) => ({
        x: p.x,
        y: p.y * cosX - p.z * sinX,
        z: p.y * sinX + p.z * cosX
    }));

    return aligned.map((p: any) => ({
        x: p.x + cx,
        y: p.y + cy,
        z: p.z + cz
    }));
}

export function analyzeSymmetry(l: any[]) {
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

export function calculateMetrics(l: any[], symmetryScore: number, detailedSymmetry: any[]) {
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

    const overallScore = (symmetryScore + finalEyeScore + finalJawScore + proportionsScore + fwhrScore) / 5;

    const strengths = [];
    const weaknesses = [];

    if (symmetryScore >= 8.5) strengths.push('Excellent facial symmetry');
    else if (symmetryScore < 7) weaknesses.push('Noticeable facial asymmetry');

    if (avgCanthalTilt > 3 && avgCanthalTilt < 10) strengths.push(`Positive canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);
    else if (avgCanthalTilt <= 0) weaknesses.push(`Negative or neutral canthal tilt (${avgCanthalTilt.toFixed(1)}°)`);

    if (fWHR >= 1.75 && fWHR <= 1.95) strengths.push(`Ideal facial width-to-height ratio (${fWHR.toFixed(2)})`);
    else if (fWHR < 1.7) weaknesses.push('Face is slightly narrow (Low fWHR)');

    if (cheekToJawRatio >= 1.2 && cheekToJawRatio <= 1.35) strengths.push('Strong, well-proportioned jawline');
    else if (cheekToJawRatio > 1.4) weaknesses.push('Jawline is narrow compared to cheekbones');

    if (Math.abs(1.618 - heightToWidthRatio) < 0.1) strengths.push('Excellent Golden Ratio proportions');

    if (strengths.length === 0) strengths.push('Balanced overall features');
    if (weaknesses.length === 0) weaknesses.push('No major structural weaknesses');

    return {
        overallScore,
        finalEyeScore,
        finalJawScore,
        proportionsScore,
        fwhrScore,
        avgCanthalTilt,
        fWHR,
        heightToWidthRatio,
        strengths,
        weaknesses
    };
}
