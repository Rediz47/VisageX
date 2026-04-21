import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import geometryRouter from './geometry.routes';

// Mock the geometry utils
vi.mock('../utils/geometry.js', () => ({
    calculateEAR: vi.fn(() => ({ leftEAR: 0.2, rightEAR: 0.2 })),
    alignLandmarks: vi.fn((l) => l),
    analyzeSymmetry: vi.fn(() => ({ symmetryScore: 8, detailedSymmetry: [], avgSymmetryScore: 80 })),
    calculateMetrics: vi.fn(() => ({ 
        overallScore: 8.5, 
        finalEyeScore: 8, 
        finalJawScore: 8, 
        proportionsScore: 8, 
        fwhrScore: 8,
        avgCanthalTilt: 5,
        fWHR: 1.8,
        heightToWidthRatio: 1.6,
        strengths: ['Good'],
        weaknesses: ['Bad']
    })),
}));

const app = express();
app.use(express.json());
app.use('/api', geometryRouter);

describe('Geometry API', () => {
    // Generate mock 468-landmark array
    const mockLandmarks = () => Array.from({ length: 468 }, () => ({ x: 0, y: 0, z: 0 }));

    it('should return 400 if no landmarks are provided', async () => {
        const res = await request(app).post('/api/analyze').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 if eyes are closed (low EAR)', async () => {
        const { calculateEAR } = await import('../utils/geometry.js');
        (calculateEAR as any).mockReturnValue({ leftEAR: 0.1, rightEAR: 0.1 });

        const res = await request(app).post('/api/analyze').send({ landmarks: mockLandmarks() });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Eyes appear to be closed');
    });

    it('should return 200 and analysis results for valid landmarks', async () => {
        const { calculateEAR } = await import('../utils/geometry.js');
        (calculateEAR as any).mockReturnValue({ leftEAR: 0.2, rightEAR: 0.2 });

        const res = await request(app).post('/api/analyze').send({ landmarks: mockLandmarks() });
        
        expect(res.status).toBe(200);
        expect(res.body.overallScore).toBe(8.5);
        expect(res.body.breakdown).toBeDefined();
        expect(res.body.metrics).toBeDefined();
    });
});
