import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AnuncioRow } from "@/lib/supabase/types";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ShareButton from "@/components/ShareButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TIPO_LABEL: Record<AnuncioRow["tipo"], string> = {
  evento: "Evento",
  aviso_barrial: "Aviso barrial",
  sponsor: "Sponsor",
  promocion: "Promoción",
  comunicado: "Comunicado",
  feria: "Feria",
  novedad: "Novedad",
};

async function getAnuncio(id: string): Promise<AnuncioRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("anuncios").select("*").eq("id", id).eq("status", "publicado").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anuncio = await getAnuncio(id);
  if (!anuncio) return { title: "Anuncio no encontrado" };

  const description = anuncio.descripcion.slice(0, 155);
  const url = `${SITE_URL}/anuncio/${id}`;
  // El flyer/imagen propia del anuncio tiene prioridad para que, al
  // compartir el link, se vea eso — el fondo ambiental es solo un marco
  // visual, no el contenido en sí. Si no hay ninguna imagen, el logo.
  const imageUrl = anuncio.imagen_url || anuncio.background_image_url || `${SITE_URL}/brand/logo-completo.png`;

  return {
    title: anuncio.titulo,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${anuncio.titulo} | ${SITE_NAME}`,
      description,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: anuncio.imagen_url || anuncio.background_image_url ? "summary_large_image" : "summary",
      title: anuncio.titulo,
      description,
      images: [imageUrl],
    },
  };
}

export default async function AnuncioPage({ params }: PageProps) {
  const { id } = await params;
  const anuncio = await getAnuncio(id);
  if (!anuncio) notFound();

  const url = `${SITE_URL}/anuncio/${id}`;
  const imageUrl = anuncio.imagen_url || anuncio.background_image_url;
  const lugarTrim = anuncio.lugar?.trim();
  const esLinkLugar = !!lugarTrim && /^https?:\/\//i.test(lugarTrim);
  const mapsUrl = lugarTrim
    ? esLinkLugar
      ? lugarTrim
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugarTrim + " Puerto Madryn")}`
    : null;

  return (
    <div className="min-h-screen bg-hueso">
      <header className="border-b border-piedra/30 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[760px] items-center justify-between">
          <Link href="/" className="font-slab text-base font-semibold text-tinta">
            Origen El Doradillo
          </Link>
          <Link href="/" className="text-[13px] font-medium text-golfo">
            Ver todas las publicaciones
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-8 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-hueso-2">
            {imageUrl ? (
              <Image src={imageUrl} alt={anuncio.titulo} fill className="object-contain" sizes="380px" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="ti ti-speakerphone text-6xl text-piedra" aria-hidden />
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-dorado">{TIPO_LABEL[anuncio.tipo]}</p>
            <h1 className="mb-2 font-slab text-2xl font-semibold text-tinta">{anuncio.titulo}</h1>
            {(anuncio.fecha_evento || lugarTrim) && (
              <p className="mb-4 flex flex-wrap items-center gap-x-1.5 text-[13.5px] font-medium text-dorado">
                <i className="ti ti-calendar-event text-sm" aria-hidden />
                {anuncio.fecha_evento && (
                  <span>{new Date(anuncio.fecha_evento).toLocaleDateString("es-AR", { timeZone: "UTC" })}</span>
                )}
                {lugarTrim && !esLinkLugar && <span>{anuncio.fecha_evento ? `· ${lugarTrim}` : lugarTrim}</span>}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline">
                    Ver en mapa
                  </a>
                )}
              </p>
            )}
            <p className="mb-4 whitespace-pre-line text-[14.5px] leading-relaxed text-tinta">{anuncio.descripcion}</p>
            {anuncio.cta_url && (
              <a
                href={anuncio.cta_url}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-dorado px-4 py-2.5 text-[13px] font-semibold text-oliva-dd"
              >
                {anuncio.cta_label?.trim() || "Ver más"}
                <i className="ti ti-arrow-right text-sm" aria-hidden />
              </a>
            )}
            <ShareButton
              url={url}
              title={anuncio.titulo}
              text={anuncio.descripcion.slice(0, 120)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-piedra/60 py-2.5 text-[13px] font-semibold text-tinta"
              label="Compartir"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
