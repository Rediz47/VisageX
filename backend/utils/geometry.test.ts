import { describe, it, expect } from 'vitest';
import { dist, analyzeSymmetry, calculateEAR, calculateMetrics } from './geometry';

describe('Geometry Utils', () => {
    it('should calculate distance correctly', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 3, y: 4 };
        expect(dist(p1, p2)).toBe(5);
    });

    it('should calculate perfect symmetry score for perfectly centered points', () => {
        // Create mock landmarks where left/right points are equidistant from center
        // landmarks[1] is noseTip (x, y, z)
        const landmarks = new Array(468).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
        
        // Midline (nose tip) at x=50
        landmarks[1] = { x: 50, y: 50, z: 0 };
        landmarks[10] = { x: 50, y: 10, z: 0 }; // Forehead
        landmarks[152] = { x: 50, y: 90, z: 0 }; // Chin

        // Symmetry pairs
        // Eyes: 33, 263
        landmarks[33] = { x: 40, y: 30, z: 0 }; // 10 units left
        landmarks[263] = { x: 60, y: 30, z: 0 }; // 10 units right
        
        // Eyebrows: 105, 334
        landmarks[105] = { x: 35, y: 25, z: 0 }; // 15 units left
        landmarks[334] = { x: 65, y: 25, z: 0 }; // 15 units right
        
        // Cheekbones: 234, 454
        landmarks[234] = { x: 30, y: 45, z: 0 }; // 20 units left
        landmarks[454] = { x: 70, y: 45, z: 0 }; // 20 units right
        
        // Jawline: 132, 361
        landmarks[132] = { x: 35, y: 70, z: 0 }; // 15 units left
        landmarks[361] = { x: 65, y: 70, z: 0 }; // 15 units right
        
        // Mouth: 61, 291
        landmarks[61] = { x: 45, y: 75, z: 0 }; // 5 units left
        landmarks[291] = { x: 55, y: 75, z: 0 }; // 5 units right

        const { symmetryScore, avgSymmetryScore } = analyzeSymmetry(landmarks);
        expect(symmetryScore).toBe(10);
        expect(avgSymmetryScore).toBe(100);
    });

    it('should detect asymmetry', () => {
        const landmarks = new Array(468).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
        landmarks[1] = { x: 50, y: 50, z: 0 };
        landmarks[10] = { x: 50, y: 10, z: 0 };
        landmarks[152] = { x: 50, y: 90, z: 0 };

        // Eyes: one is 10 units away, one is 15 units away
        landmarks[33] = { x: 40, y: 30, z: 0 };
        landmarks[263] = { x: 65, y: 30, z: 0 };
        
        const { avgSymmetryScore } = analyzeSymmetry(landmarks);
        expect(avgSymmetryScore).toBeLessThan(100);
    });
    it('should calculate EAR correctly', () => {
        const landmarks = new Array(468).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
        // Mock eyes
        landmarks[159] = { x: 10, y: 5, z: 0 }; // Top
        landmarks[145] = { x: 10, y: 15, z: 0 }; // Bottom
        landmarks[133] = { x: 5, y: 10, z: 0 }; // Inner
        landmarks[33] = { x: 25, y: 10, z: 0 }; // Outer (width = 20, height = 10)
        
        const { leftEAR } = calculateEAR(landmarks);
        expect(leftEAR).toBe(10 / 20); // 0.5
    });

    it('should calculate metrics and final score', () => {
        const landmarks = new Array(468).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
        // Mock landmarks for balanced proportions
        landmarks[1] = { x: 50, y: 50, z: 0 };
        landmarks[10] = { x: 50, y: 10, z: 0 };
        landmarks[152] = { x: 50, y: 90, z: 0 };
        
        // Eyes
        landmarks[33] = { x: 40, y: 30, z: 0 };
        landmarks[263] = { x: 60, y: 30, z: 0 };
        landmarks[133] = { x: 45, y: 30, z: 0 };
        landmarks[362] = { x: 55, y: 30, z: 0 };

        // Cheeks (for width)
        landmarks[234] = { x: 30, y: 50, z: 0 };
        landmarks[454] = { x: 70, y: 50, z: 0 };
        
        // Jaw (for jaw width)
        landmarks[132] = { x: 35, y: 80, z: 0 };
        landmarks[361] = { x: 65, y: 80, z: 0 };

        // Lips/Eyebrows (for midface height)
        landmarks[13] = { x: 50, y: 65, z: 0 };
        landmarks[107] = { x: 45, y: 25, z: 0 };
        landmarks[336] = { x: 55, y: 25, z: 0 };

        const { symmetryScore, detailedSymmetry } = analyzeSymmetry(landmarks);
        const result = calculateMetrics(landmarks, symmetryScore, detailedSymmetry);
        
        expect(result.overallScore).toBeDefined();
        expect(result.overallScore).toBeGreaterThan(0);
        expect(result.overallScore).toBeLessThanOrEqual(10);
    });
});
