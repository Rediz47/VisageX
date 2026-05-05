import sharp from 'sharp';

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 80;

/**
 * Compresses a base64 image: resizes to fit within MAX_DIMENSION and re-encodes as JPEG.
 * Returns { base64, mimeType } ready for Vertex AI inlineData.
 * If sharp fails (e.g. unsupported format), the original data is returned unchanged.
 */
export async function compressBase64Image(
  base64Data: string,
  inputMimeType: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    const inputBuffer = Buffer.from(base64Data, 'base64');

    const compressed = await sharp(inputBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const originalSize = inputBuffer.length;
    const compressedSize = compressed.length;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(
      `Image compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${ratio}% reduction)`
    );

    return {
      base64: compressed.toString('base64'),
      mimeType: 'image/jpeg'
    };
  } catch (err) {
    console.warn('Image compression failed, using original:', (err as Error).message);
    return { base64: base64Data, mimeType: inputMimeType };
  }
}
