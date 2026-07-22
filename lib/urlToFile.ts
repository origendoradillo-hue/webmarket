// Para re-editar (recortar de nuevo) una foto ya subida: la baja de
// Supabase Storage (CORS abierto en ese bucket) y la envuelve como File
// para poder pasarla tal cual a PhotoCropModal, igual que un archivo
// recién elegido del selector.
export async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
