"use client";

import { useState } from "react";
import Image from "next/image";
import { Anuncio, AnuncioLayoutType, TipoAnuncio } from "@/lib/types";
import { SITE_URL } from "@/lib/seo";
import ShareButton from "./ShareButton";

const TIPO_LABEL: Record<TipoAnuncio, string> = {
  evento: "Evento",
  aviso_barrial: "Aviso barrial",
  sponsor: "Sponsor",
  promocion: "Promoción",
  comunicado: "Comunicado",
  feria: "Feria",
  novedad: "Novedad",
};

const TIPO_ICON: Record<TipoAnuncio, string> = {
  evento: "ti-calendar-event",
  aviso_barrial: "ti-alert-triangle",
  sponsor: "ti-award",
  promocion: "ti-discount-2",
  comunicado: "ti-speakerphone",
  feria: "ti-shopping-bag",
  novedad: "ti-sparkles",
};

interface SlideProps {
  a: Anuncio;
  priority: boolean;
}

interface Cta {
  label: string;
  href: string;
}

function buildCta(a: Anuncio): Cta | null {
  if (!a.ctaUrl) return null;
  return { label: a.ctaLabel?.trim() || "Ver anuncio", href: a.ctaUrl };
}

function TipoBadge({ tipo, variant = "subtle" }: { tipo: TipoAnuncio; variant?: "solid" | "subtle" }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${
        variant === "solid" ? "bg-dorado text-oliva-dd" : "bg-dorado/15 text-dorado"
      }`}
    >
      <i className={`ti ${TIPO_ICON[tipo]} text-xs`} aria-hidden />
      {TIPO_LABEL[tipo]}
    </span>
  );
}

function FechaLugar({ a }: { a: Anuncio }) {
  if (!a.fechaEvento && !a.lugar) return null;

  const lugarTrim = a.lugar?.trim();
  const esLink = !!lugarTrim && /^https?:\/\//i.test(lugarTrim);
  const mapsUrl = lugarTrim
    ? esLink
      ? lugarTrim
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugarTrim + " Puerto Madryn")}`
    : null;

  const parts: React.ReactNode[] = [];
  if (a.fechaEvento) parts.push(new Date(a.fechaEvento).toLocaleDateString("es-AR", { timeZone: "UTC" }));
  if (lugarTrim && !esLink) parts.push(lugarTrim);
  if (mapsUrl) {
    // Botón, no <a>: la tarjeta entera puede ser un link (SlideLink) cuando
    // hay CTA, y un <a> anidado dentro de otro <a> es HTML inválido.
    parts.push(
      <button
        key="maps"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(mapsUrl, "_blank", "noreferrer");
        }}
        className="underline"
      >
        Ver en mapa
      </button>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[11.5px] font-medium text-dorado">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>·</span>}
          {part}
        </span>
      ))}
    </p>
  );
}

function CtaButton({ cta }: { cta: Cta }) {
  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noreferrer"
      // La tarjeta entera abre el modal de detalle al tocarla — este botón
      // es una acción aparte (ir directo al link externo), por eso frena
      // la propagación en vez de dejar que también abra el modal.
      onClick={(e) => e.stopPropagation()}
      className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-dorado px-4 py-2 text-[12.5px] font-semibold text-oliva-dd transition hover:brightness-95"
    >
      {cta.label}
      <i className="ti ti-arrow-right text-sm" aria-hidden />
    </a>
  );
}

// Toda la tarjeta es clickeable siempre (tenga o no CTA externo) para
// abrir el modal con la descripción completa del anuncio.
function SlideLink({ onOpen, className, children }: { onOpen: () => void; className: string; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}

function AnuncioDetailModal({ a, onClose }: { a: Anuncio; onClose: () => void }) {
  const cta = buildCta(a);
  const imgSrc = a.imagen || a.backgroundImagen;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Anuncio</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto">
          {imgSrc && (
            <div className="relative aspect-[4/3] w-full bg-hueso-2">
              <Image src={imgSrc} alt={a.titulo} fill className="object-contain" sizes="480px" />
            </div>
          )}
          <div className="flex flex-col gap-2 px-5 py-4">
            <TipoBadge tipo={a.tipo} />
            <h3 className="font-slab text-lg font-semibold text-tinta">{a.titulo}</h3>
            <FechaLugar a={a} />
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-tinta-suave">{a.descripcion}</p>
            {cta && (
              <a
                href={cta.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-dorado px-4 py-2 text-[12.5px] font-semibold text-oliva-dd transition hover:brightness-95"
              >
                {cta.label}
                <i className="ti ti-arrow-right text-sm" aria-hidden />
              </a>
            )}
            <ShareButton
              url={a.shortCode ? `${SITE_URL}/p/${a.shortCode}` : `${SITE_URL}/anuncio/${a.id}`}
              title={a.titulo}
              text={a.descripcion.slice(0, 120)}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-piedra/60 px-4 py-2 text-[12.5px] font-semibold text-tinta"
              label="Compartir"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Fondos institucionales por defecto — fotos reales de la estepa
// patagónica, para flyer_on_sign / background_image / full_banner cuando
// el admin todavía no cargó una imagen propia.
const FONDO_ESTEPA = "/brand/anuncio-fondo-estepa.png";
const FONDO_INSTITUCIONAL = "/brand/anuncio-fondo-institucional.png";
const CARTEL_COLGANTE = "/brand/cartel-colgante.png";

// Rectángulo exacto (medido en la imagen fuente, 900x1050px) donde el
// cartel tiene el recorte en croma verde para insertar el flyer del
// usuario — el resto del PNG (postes, travesaño, marco) es transparente
// alrededor y opaco en el marco/estructura.
const CARTEL_FLYER_RECT = { left: "23.44%", top: "26.19%", width: "53%", height: "58%" };

function FlyerBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-oliva/15 px-2.5 py-1 text-[10.5px] font-semibold text-oliva">
      <i className="ti ti-photo text-xs" aria-hidden />
      Flyer vertical integrado
    </span>
  );
}

function FlyerOnSignSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);

  return (
    <>
    <SlideLink onOpen={() => setDetailOpen(true)} className="grid sm:grid-cols-2">
      <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden p-6 sm:min-h-[440px]">
        <Image
          src={a.backgroundImagen && !bgFailed ? a.backgroundImagen : FONDO_ESTEPA}
          alt=""
          aria-hidden
          fill
          className="object-cover"
          sizes="(min-width: 640px) 50vw, 100vw"
          priority={priority}
          onError={() => setBgFailed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-oliva-dd/30 to-oliva-dd/5" />

        {/* Cartel real (postes, travesaño, ganchos, marco) — el flyer del
            usuario se compone sobre el recorte de croma verde del PNG,
            en el rectángulo exacto medido en CARTEL_FLYER_RECT. */}
        <div className="relative h-[300px] sm:h-[380px]" style={{ aspectRatio: "900 / 1050" }}>
          <Image src={CARTEL_COLGANTE} alt="" aria-hidden fill className="object-contain" sizes="380px" />
          <div
            className="absolute overflow-hidden rounded-sm bg-hueso-2"
            style={CARTEL_FLYER_RECT}
          >
            {a.imagen && !imgFailed ? (
              <Image
                src={a.imagen}
                alt={a.titulo}
                fill
                className="object-contain"
                sizes="220px"
                priority={priority}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <i className="ti ti-photo-off text-4xl text-piedra" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 bg-hueso-2 px-5 py-5 sm:px-8 sm:py-7">
        <FlyerBadge />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta sm:text-xl">{a.titulo}</h3>
        <p className="text-[13px] leading-relaxed text-tinta-suave sm:text-[13.5px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </SlideLink>
    {detailOpen && <AnuncioDetailModal a={a} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

function FullBannerSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);

  return (
    <>
    <SlideLink onOpen={() => setDetailOpen(true)} className="relative block h-44 w-full sm:h-64">
      <Image
        src={a.imagen && !imgFailed ? a.imagen : FONDO_ESTEPA}
        alt={a.titulo}
        fill
        className="object-cover"
        sizes="100vw"
        priority={priority}
        onError={() => setImgFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute left-3 top-3">
        <TipoBadge tipo={a.tipo} variant="solid" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <h3 className="font-slab text-base font-semibold leading-tight text-white sm:text-lg">{a.titulo}</h3>
        <p className="mt-1 line-clamp-2 max-w-[560px] text-[12px] text-white/85 sm:text-[13px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && (
          <div className="mt-2">
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </SlideLink>
    {detailOpen && <AnuncioDetailModal a={a} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

function BackgroundImageSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);
  const bg = a.backgroundImagen || a.imagen;

  return (
    <>
    <SlideLink onOpen={() => setDetailOpen(true)} className="relative block h-52 w-full sm:h-72">
      <Image
        src={bg && !imgFailed ? bg : FONDO_ESTEPA}
        alt=""
        aria-hidden
        fill
        className="object-cover"
        sizes="100vw"
        priority={priority}
        onError={() => setImgFailed(true)}
      />
      <div className="absolute inset-0 bg-oliva-dd/20" />
      <div className="absolute inset-x-3 bottom-3 max-w-[420px] rounded-xl bg-oliva-dd/92 p-4 shadow-lg sm:inset-x-auto sm:bottom-6 sm:left-6">
        <TipoBadge tipo={a.tipo} variant="solid" />
        <h3 className="mt-1.5 font-slab text-base font-semibold leading-tight text-white sm:text-lg">{a.titulo}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] text-white/85 sm:text-[13px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && (
          <div className="mt-2">
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </SlideLink>
    {detailOpen && <AnuncioDetailModal a={a} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

function TextOnlySlide({ a }: SlideProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);

  return (
    <>
    <SlideLink
      onOpen={() => setDetailOpen(true)}
      className="relative flex min-h-[176px] flex-col items-start justify-center gap-2 overflow-hidden px-5 py-6 sm:min-h-[220px] sm:px-10"
    >
      <Image src={FONDO_INSTITUCIONAL} alt="" aria-hidden fill className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-hueso/85" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-dorado bg-hueso-2">
        <i className={`ti ${TIPO_ICON[a.tipo]} text-xl text-oliva`} aria-hidden />
      </div>
      <div className="relative flex flex-col gap-2">
        <TipoBadge tipo={a.tipo} />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta sm:text-xl">{a.titulo}</h3>
        <p className="max-w-[560px] text-[13px] leading-relaxed text-tinta-suave sm:text-[13.5px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </SlideLink>
    {detailOpen && <AnuncioDetailModal a={a} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

export function resolveLayout(a: Anuncio): AnuncioLayoutType {
  return a.layoutType;
}

interface AnuncioSlideProps {
  anuncio: Anuncio;
  priority: boolean;
}

export default function AnuncioSlide({ anuncio, priority }: AnuncioSlideProps) {
  switch (resolveLayout(anuncio)) {
    case "flyer_on_sign":
      return <FlyerOnSignSlide a={anuncio} priority={priority} />;
    case "background_image":
      return <BackgroundImageSlide a={anuncio} priority={priority} />;
    case "text_only":
      return <TextOnlySlide a={anuncio} priority={priority} />;
    case "full_banner":
    default:
      return <FullBannerSlide a={anuncio} priority={priority} />;
  }
}
