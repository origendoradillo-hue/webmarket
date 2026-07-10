// Las fotos de celular llegan a 3000-4000px y 3-4 MB sin comprimir. Eso
// hace lenta la carga de las publicaciones y, más grave, WhatsApp no
// muestra la vista previa (og:image) de links con imágenes tan pesadas
// porque su crawler no llega a bajarlas/procesarlas a tiempo. Se
// redimensionan y comprimen en el navegador antes de subir.
export async function resizeImage(file: File | Blob, maxDimension = 1600, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob || file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
