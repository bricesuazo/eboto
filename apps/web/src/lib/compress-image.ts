/**
 * Downscales an image to fit within `maxDim × maxDim` (preserving aspect
 * ratio, never upscaling) and re-encodes it as WebP. Returns a new `File`.
 *
 * Uses `createImageBitmap` + `OffscreenCanvas` where available, falls back
 * to `HTMLImageElement` + `<canvas>` for older browsers. Both paths flatten
 * animated WebP to a single frame — acceptable since we accept PNG/JPEG/WebP
 * for avatar/logo use cases where animation isn't expected.
 */
export async function compressImage(
  file: File,
  { maxDim = 800, quality = 0.85 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  const { width, height } = await readDimensions(file);
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const blob = await encodeWebp(file, targetW, targetH, quality);
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

async function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  }
  const img = await loadHtmlImage(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

async function encodeWebp(
  file: File,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  if (
    typeof createImageBitmap === 'function' &&
    typeof OffscreenCanvas === 'function'
  ) {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
    });
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await canvas.convertToBlob({ type: 'image/webp', quality });
  }

  const img = await loadHtmlImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/webp',
      quality,
    );
  });
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}
