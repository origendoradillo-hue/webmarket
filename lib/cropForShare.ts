// Las fotos de celular suelen ser muy verticales (ej. 1131x1600), lejos
// del 1.91:1 que esperan los crawlers de WhatsApp/Facebook para el
// og:image — con ese desvío, muchas veces no muestran ninguna imagen al
// compartir el link. Acá se genera, aparte, un recorte centrado en 1.91:1
// pensado solo para esa vista previa; la foto original se sigue mostrando
// completa (sin recortar) en la publicación.
export async function cropForShare(file: File | Blob, targetW = 1200, targetH = 630, quality = 0.85): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const srcW = targetW / scale;
    const srcH = targetH / scale;
    const srcX = (img.naturalWidth - srcW) / 2;
    const srcY = (img.naturalHeight - srcH) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
