export const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export async function checkImageLightingAndBlur(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): Promise<void> {
  const checkCanvas = document.createElement('canvas');
  const checkCtx = checkCanvas.getContext('2d');
  if (!checkCtx) return;

  // Scale down to max 300px for faster processing
  const scale = Math.min(300 / cropW, 300 / cropH, 1);
  checkCanvas.width = Math.floor(cropW * scale);
  checkCanvas.height = Math.floor(cropH * scale);

  // Draw only the cropped face area
  checkCtx.drawImage(
    img,
    cropX, cropY, cropW, cropH,
    0, 0, checkCanvas.width, checkCanvas.height
  );

  const imageData = checkCtx.getImageData(0, 0, checkCanvas.width, checkCanvas.height);
  const data = imageData.data;

  // 1. Brightness Check
  await yieldToMain();
  let totalLuminance = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalLuminance += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  const avgBrightness = totalLuminance / (data.length / 4);

  if (avgBrightness < 30) {
    throw new Error("Photo is too dark. Please take a photo in better lighting.");
  }
  if (avgBrightness > 220) {
    throw new Error("Photo is too bright or overexposed. Please adjust lighting.");
  }

  // 2. Blur Check (Laplacian Variance)
  const width = checkCanvas.width;
  const height = checkCanvas.height;
  const gray = new Uint8Array(width * height);
  await yieldToMain();

  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val =
        gray[idx - width] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx + width] -
        4 * gray[idx];

      sum += val;
      sumSq += val * val;
      count++;
    }
  }

  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);

  if (variance < 50) {
    throw new Error("Photo is too blurry. Please hold the camera still and try again.");
  }
}
