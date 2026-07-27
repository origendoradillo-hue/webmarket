// Arma una portada tipo "mosaico" (4:3) combinando hasta 4 fotos ya
// subidas — para publicaciones con varias fotos o productos distintos,
// en vez de que la portada sea una sola foto recortada. Corre en el
// navegador (usa <canvas>), nunca en el servidor.

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CANVAS_W = 1200;
const CANVAS_H = 900; // 4:3, misma proporción que foto_portada_url
const GAP = 10;

function layoutFor(n: number): Rect[] {
  if (n <= 2) {
    const w = (CANVAS_W - GAP) / 2;
    return [
      { x: 0, y: 0, w, h: CANVAS_H },
      { x: w + GAP, y: 0, w, h: CANVAS_H },
    ];
  }
  if (n === 3) {
    const wLeft = Math.round((CANVAS_W - GAP) * 0.55);
    const wRight = CANVAS_W - GAP - wLeft;
    const hRight = (CANVAS_H - GAP) / 2;
    return [
      { x: 0, y: 0, w: wLeft, h: CANVAS_H },
      { x: wLeft + GAP, y: 0, w: wRight, h: hRight },
      { x: wLeft + GAP, y: hRight + GAP, w: wRight, h: hRight },
    ];
  }
  const w = (CANVAS_W - GAP) / 2;
  const h = (CANVAS_H - GAP) / 2;
  return [
    { x: 0, y: 0, w, h },
    { x: w + GAP, y: 0, w, h },
    { x: 0, y: h + GAP, w, h },
    { x: w + GAP, y: h + GAP, w, h },
  ];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

export async function generateMosaic(dataUrls: string[]): Promise<Blob | null> {
  const photos = dataUrls.slice(0, 4);
  if (photos.length < 2) return null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const rects = layoutFor(photos.length);
  const images = await Promise.all(photos.map(loadImage));

  images.forEach((img, i) => {
    const rect = rects[i];
    // Recorte tipo object-fit:cover — centra y recorta la fuente para
    // llenar la celda sin deformar la imagen.
    const srcAspect = img.width / img.height;
    const dstAspect = rect.w / rect.h;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (srcAspect > dstAspect) {
      sw = img.height * dstAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / dstAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  });

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9));
}
