import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase.from("listings").select("id").eq("short_code", code).eq("status", "activa").maybeSingle();
  if (listing) return NextResponse.redirect(`${SITE_URL}/publicacion/${listing.id}`);

  const { data: anuncio } = await supabase.from("anuncios").select("id").eq("short_code", code).eq("status", "publicado").maybeSingle();
  if (anuncio) return NextResponse.redirect(`${SITE_URL}/anuncio/${anuncio.id}`);

  return NextResponse.redirect(SITE_URL);
}
