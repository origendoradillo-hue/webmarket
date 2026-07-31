import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { code } = await params;
  const supabase = await createClient();

  // 308 (permanente) en vez del 307 por defecto — un código corto siempre
  // apunta al mismo destino mientras la publicación exista, así que es
  // correcto pedirle al buscador que consolide todo en el destino en vez
  // de tratar este link como una redirección temporal.
  const { data: listing } = await supabase.from("listings").select("id").eq("short_code", code).eq("status", "activa").maybeSingle();
  if (listing) return NextResponse.redirect(`${SITE_URL}/publicacion/${listing.id}`, 308);

  const { data: anuncio } = await supabase.from("anuncios").select("id").eq("short_code", code).eq("status", "publicado").maybeSingle();
  if (anuncio) return NextResponse.redirect(`${SITE_URL}/anuncio/${anuncio.id}`, 308);

  return NextResponse.redirect(SITE_URL, 308);
}
