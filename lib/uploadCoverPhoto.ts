import type { SupabaseClient } from "@supabase/supabase-js";
import { cropForShare } from "./cropForShare";

// Sube una foto de portada (ya recortada/redimensionada) al bucket
// listing-photos, más su recorte 1.91:1 para compartir (lib/cropForShare.ts)
// — usado tanto al subir/reemplazar la portada como al re-editar el
// recorte de una ya existente. `pathPrefix` deja que cada llamador use su
// propia convención de carpeta (el vecino sube bajo su user id, el admin
// bajo "admin/<listing id>").
export async function uploadCoverPhoto(
  supabase: SupabaseClient,
  blob: Blob,
  pathPrefix: string
): Promise<{ fotoUrl: string; fotoOgUrl: string | null }> {
  const path = `${pathPrefix}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;
  const fotoUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;

  let fotoOgUrl: string | null = null;
  const cropped = await cropForShare(blob);
  if (cropped) {
    const ogPath = `${pathPrefix}/${Date.now()}-og.jpg`;
    const { error: ogError } = await supabase.storage.from("listing-photos").upload(ogPath, cropped, { contentType: "image/jpeg" });
    if (!ogError) fotoOgUrl = supabase.storage.from("listing-photos").getPublicUrl(ogPath).data.publicUrl;
  }
  return { fotoUrl, fotoOgUrl };
}
