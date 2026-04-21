import { Landmark, AnalysisResult, Point2D } from '../types';

export function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  imgWidth: number,
  imgHeight: number,
  cropX: number,
  cropY: number,
  analysisResult?: AnalysisResult
) {
  // Pure clean photo — no lines, no mesh, no overlays baked into the image.
  // All visual overlays are handled by the React SVG layer in FacialRatioExplorer.
}
