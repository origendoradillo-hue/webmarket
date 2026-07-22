export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Recorta una imagen a partir de las coordenadas de píxeles que da
// react-easy-crop (ver components/PhotoCropModal.tsx), usando un canvas —
// mismo patrón que ya usa lib/cropForShare.ts.
export async function cropToBlob(imageSrc: string, cropPixels: CropPixels, quality = 0.9): Promise<Blob | null> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, cropPixels.width, cropPixels.height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
