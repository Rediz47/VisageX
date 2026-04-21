import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import MeshLines from './MeshLines';
import MeshDots from './MeshDots';
import MeasurementLines from './MeasurementLines';

interface AnimatedFaceMeshProps {
  imageUrl: string;
  landmarks?: { x: number; y: number; z?: number }[];
  cropInfo?: { cropX: number; cropY: number; imgWidth: number; imgHeight: number; cropW: number; cropH: number };
  metrics?: Record<string, string | number>;
  isDarkMode: boolean;
  hideMesh?: boolean;
}

/**
 * AnimatedFaceMesh — Premium SVG face mesh overlay
 *
 * Renders animated MediaPipe face mesh connections, landmark dots,
 * and measurement lines on top of the analyzed face image.
 *
 * Performance: Uses React.memo on sub-components and useMemo for point mapping.
 */
const AnimatedFaceMesh = React.memo(function AnimatedFaceMesh({
  imageUrl,
  landmarks,
  cropInfo,
  metrics,
  isDarkMode,
  hideMesh = false,
}: AnimatedFaceMeshProps) {
  const [showMesh, setShowMesh] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Map raw landmarks to cropped image coordinates (0-1 range relative to crop)
  const mappedPoints = useMemo(() => {
    if (!landmarks || !cropInfo) return [];
    const { cropX, cropY, imgWidth, imgHeight, cropW, cropH } = cropInfo;

    return landmarks.map((lm) => {
      // Convert normalized landmark to pixel in original image space
      const px = lm.x * imgWidth;
      const py = lm.y * imgHeight;
      // Offset by crop origin, then normalize to crop dimensions (0-1)
      const nx = (px - cropX) / cropW;
      const ny = (py - cropY) / cropH;
      return { x: nx, y: ny };
    });
  }, [landmarks, cropInfo]);

  const hasLandmarks = mappedPoints.length >= 468;

  // Use the crop aspect ratio for the SVG viewBox
  const viewW = 1000;
  const viewH = cropInfo ? Math.round((cropInfo.cropH / cropInfo.cropW) * 1000) : 1000;

  return (
    <div
      className="relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Face Image */}
      <img
        src={imageUrl}
        alt="Analyzed Face"
        className="w-full h-auto block"
        referrerPolicy="no-referrer"
        style={{
          filter: !hideMesh && showMesh ? 'brightness(0.88) contrast(1.05)' : 'none',
          transition: 'filter 0.6s ease',
        }}
      />

      {/* SVG Overlay — completely hidden when hideMesh */}
      {hasLandmarks && !hideMesh && (
        <AnimatePresence>
          {showMesh && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <svg
                viewBox={`0 0 ${viewW} ${viewH}`}
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full"
              >
                {/* Mesh tessellation lines — hidden when hideMesh is true */}
                {!hideMesh && <MeshLines points={mappedPoints} width={viewW} height={viewH} />}

                {/* Landmark dots — hidden when hideMesh is true */}
                {!hideMesh && <MeshDots points={mappedPoints} width={viewW} height={viewH} />}

                {/* Measurement overlays — also hidden when hideMesh */}
                {!hideMesh && showMeasurements && (
                  <MeasurementLines
                    points={mappedPoints}
                    width={viewW}
                    height={viewH}
                    metrics={metrics}
                  />
                )}
              </svg>

              {!hideMesh && (
                <>
                  {/* Scanning sweep effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                      className="mesh-scan-sweep absolute left-0 right-0 h-[2px]"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), rgba(99,102,241,0.4), transparent)',
                        boxShadow: '0 0 12px rgba(34,211,238,0.15)',
                      }}
                    />
                  </div>

                  {/* Corner decorations — tech frame */}
                  <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-cyan-400/30 rounded-tl" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-cyan-400/30 rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-cyan-400/30 rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-cyan-400/30 rounded-br" />

                  {/* Bottom label */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[8px] font-mono font-bold text-cyan-400/80 uppercase tracking-[0.2em]">
                      468 LANDMARKS ACTIVE
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Control buttons — appear on hover, hidden when hideMesh */}
      {hasLandmarks && !hideMesh && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-3 right-3 flex flex-col gap-2 z-20"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowMesh(!showMesh); }}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
              showMesh
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                : (isDarkMode ? 'bg-black/40 border-white/10 text-white/60' : 'bg-white/60 border-zinc-200 text-zinc-600')
            }`}
            title={showMesh ? 'Hide Mesh' : 'Show Mesh'}
          >
            {showMesh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {showMesh && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowMeasurements(!showMeasurements); }}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
                showMeasurements
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : (isDarkMode ? 'bg-black/40 border-white/10 text-white/60' : 'bg-white/60 border-zinc-200 text-zinc-600')
              }`}
              title={showMeasurements ? 'Hide Measurements' : 'Show Measurements'}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
});

export default AnimatedFaceMesh;
