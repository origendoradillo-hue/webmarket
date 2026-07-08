import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/supabase/types";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import ContactarPublicacionButton from "@/components/ContactarPublicacionButton";
import ShareButton from "@/components/ShareButton";
import RegistrarVista from "@/components/RegistrarVista";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ListingWithPublisher = ListingRow & {
  profiles: {
    full_name: string | null;
    nickname: string | null;
    whatsapp_number: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
  } | null;
};

async function getListing(id: string): Promise<ListingWithPublisher | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, profiles!listings_publisher_id_fkey(full_name, nickname, whatsapp_number, instagram_url, facebook_url)")
    .eq("id", id)
    .eq("status", "activa")
    .maybeSingle();
  return data as unknown as ListingWithPublisher | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Publicación no encontrada" };

  const description = listing.descripcion.slice(0, 155);
  const url = `${SITE_URL}/publicacion/${id}`;
  // Si la publicación no tiene foto propia, igual mostramos algo al
  // compartir el link (el logo) en vez de dejar la tarjeta sin imagen.
  const imageUrl = listing.foto_url || `${SITE_URL}/brand/logo-completo.png`;

  return {
    title: listing.nombre,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${listing.nombre} | ${SITE_NAME}`,
      description,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: listing.foto_url ? "summary_large_image" : "summary",
      title: listing.nombre,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicacionPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const supabase = await createClient();
  const [{ data: categoria }, { data: images }, { data: { user } }] = await Promise.all([
    listing.categoria ? supabase.from("categories").select("label").eq("id", listing.categoria).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("listing_images").select("url").eq("listing_id", id).order("orden"),
    supabase.auth.getUser(),
  ]);

  const nombrePublicador = listing.profiles?.nickname?.trim() || listing.profiles?.full_name?.trim() || "Vecino de la zona";
  const url = `${SITE_URL}/publicacion/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": listing.intencion === "ofrezco" ? "Product" : "Offer",
    name: listing.nombre,
    description: listing.descripcion,
    image: listing.foto_url || undefined,
    url,
    ...(listing.precio && !listing.precio_a_consultar
      ? { offers: { "@type": "Offer", price: listing.precio, priceCurrency: "ARS", availability: "https://schema.org/InStock" } }
      : {}),
  };

  return (
    <div className="min-h-screen bg-hueso">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RegistrarVista listingId={id} />

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
            {listing.foto_url ? (
              <Image src={listing.foto_url} alt={listing.nombre} fill className="object-cover" sizes="380px" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="ti ti-photo text-6xl text-piedra" aria-hidden />
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-dorado">
              {categoria?.label || "Otro"}
              {listing.subcategoria ? ` · ${listing.subcategoria}` : ""}
            </p>
            <h1 className="mb-2 font-slab text-2xl font-semibold text-tinta">{listing.nombre}</h1>
            {(listing.precio || listing.precio_a_consultar) && (
              <p className="mb-2 font-slab text-lg font-semibold text-tinta">
                {listing.precio_a_consultar ? "Precio a consultar" : `$${listing.precio!.toLocaleString("es-AR")}`}
              </p>
            )}
            <p className="mb-4 flex items-center gap-1 text-[13.5px] text-tinta">
              <i className="ti ti-map-pin text-sm" aria-hidden />
              {listing.zona}
              {listing.cuadrante ? ` ${listing.cuadrante}` : ""}
            </p>
            <p className="mb-2 text-[13px] text-tinta-suave">
              Publica <span className="font-medium text-tinta">{nombrePublicador}</span>
            </p>
            {(listing.profiles?.instagram_url || listing.profiles?.facebook_url) && (
              <div className="mb-3 flex items-center gap-2.5">
                {listing.profiles.instagram_url && (
                  <a href={listing.profiles.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <i className="ti ti-brand-instagram text-lg text-tinta-suave" aria-hidden />
                  </a>
                )}
                {listing.profiles.facebook_url && (
                  <a href={listing.profiles.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <i className="ti ti-brand-facebook text-lg text-tinta-suave" aria-hidden />
                  </a>
                )}
              </div>
            )}
            <ContactarPublicacionButton
              listingId={id}
              nombre={listing.nombre}
              whatsappPublico={listing.whatsapp_publico}
              isLoggedIn={!!user}
              isOwner={!!user && user.id === listing.publisher_id}
            />
            <ShareButton
              url={url}
              title={listing.nombre}
              text={listing.descripcion.slice(0, 120)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-piedra/60 py-2.5 text-[13px] font-semibold text-tinta"
              label="Compartir"
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-2 font-slab text-base font-semibold text-tinta">Descripción</h2>
          <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-tinta">{listing.descripcion}</p>
        </div>

        {images && images.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {images.map((im) => (
              <div key={im.url} className="relative aspect-square overflow-hidden rounded-lg bg-hueso-2">
                <Image src={im.url} alt={listing.nombre} fill className="object-cover" sizes="200px" />
              </div>
            ))}
          </div>
        )}

        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {listing.tags.map((t) => (
              <span key={t} className="rounded-full bg-hueso-2 px-2.5 py-1 text-[11.5px] text-golfo">
                #{t.replace(/\s+/g, "")}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
