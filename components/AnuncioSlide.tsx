"use client";

import { useState } from "react";
import Image from "next/image";
import { Anuncio, AnuncioLayoutType, TipoAnuncio } from "@/lib/types";

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
    <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-dorado px-4 py-2 text-[12.5px] font-semibold text-oliva-dd transition group-hover:brightness-95">
      {cta.label}
      <i className="ti ti-arrow-right text-sm" aria-hidden />
    </span>
  );
}

// Toda la tarjeta se vuelve clickeable cuando hay CTA (antes solo lo era
// el botón interno) — así se puede "ver más información" tocando
// cualquier parte del anuncio, no solo un link chico.
function SlideLink({ cta, className, children }: { cta: Cta | null; className: string; children: React.ReactNode }) {
  if (!cta) return <div className={className}>{children}</div>;
  return (
    <a href={cta.href} target="_blank" rel="noreferrer" className={`group ${className}`}>
      {children}
    </a>
  );
}

// Fondo institucional por defecto para flyer_on_sign / background_image
// cuando el admin todavía no cargó una foto de fondo propia — un paisaje
// de estepa abstraído con los colores de la marca, en vez de un degradé liso.
function DefaultFondo() {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <rect width="400" height="300" fill="#1C261C" />
      <circle cx="322" cy="58" r="30" fill="#B8863E" opacity="0.28" />
      <path d="M0 175 Q90 140 180 172 T400 158 V300 H0 Z" fill="#33402A" />
      <path d="M0 215 Q110 185 230 213 T400 200 V300 H0 Z" fill="#2A331F" />
      <path d="M0 255 Q130 232 260 252 T400 244 V300 H0 Z" fill="#232C1B" />
    </svg>
  );
}

// Escena ilustrada de "cartel de campo": cielo, meseta lejana, lomas,
// franja de agua (el golfo), duna, camino de tierra, pastos y alambrado.
// No es una foto real (no puedo generar fotografía) — es la ilustración
// de marca que reemplaza al fondo liso cuando el admin no subió una
// imagen de fondo propia.
function CartelDeCampoFondo() {
  return (
    <svg viewBox="0 0 480 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cartelCielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#AFC2C4" />
          <stop offset="70%" stopColor="#E9E1CF" />
          <stop offset="100%" stopColor="#F2EDE4" />
        </linearGradient>
      </defs>
      <rect width="480" height="600" fill="url(#cartelCielo)" />
      <path d="M0 250 L70 220 L150 245 L230 215 L320 240 L400 218 L480 235 V600 H0 Z" fill="#7C8A78" opacity="0.35" />
      <path d="M0 300 Q120 265 240 295 T480 285 V600 H0 Z" fill="#8E9B7C" opacity="0.55" />
      <rect x="0" y="330" width="480" height="14" fill="#4C6B70" opacity="0.4" />
      <path d="M0 350 Q140 320 260 345 T480 335 V600 H0 Z" fill="#C9A672" opacity="0.55" />
      <path d="M0 400 Q160 370 300 392 T480 380 V600 H0 Z" fill="#33402A" opacity="0.3" />
      <path
        d="M195 600 C205 520 215 470 235 420 C245 395 255 385 265 375 L285 380 C272 392 260 405 250 428 C230 478 222 525 218 600 Z"
        fill="#EFE6D3"
        opacity="0.55"
      />
      <g stroke="#2A331F" strokeWidth="2" opacity="0.55" strokeLinecap="round" fill="none">
        <path d="M40 560 Q35 535 42 512" />
        <path d="M55 562 Q52 540 58 518" />
        <path d="M400 545 Q396 522 404 500" />
        <path d="M415 548 Q412 528 418 508" />
        <path d="M430 552 Q428 532 434 514" />
      </g>
      <g stroke="#5C3D2E" strokeWidth="3" opacity="0.5" strokeLinecap="round">
        <line x1="30" y1="470" x2="30" y2="520" />
        <line x1="70" y1="465" x2="70" y2="515" />
        <line x1="30" y1="485" x2="70" y2="480" />
      </g>
    </svg>
  );
}

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
  const cta = buildCta(a);

  return (
    <SlideLink cta={cta} className="grid sm:grid-cols-2">
      <div className="relative flex items-center justify-center overflow-hidden px-6 py-12 sm:py-14">
        {a.backgroundImagen && !bgFailed ? (
          <Image
            src={a.backgroundImagen}
            alt=""
            aria-hidden
            fill
            className="object-cover"
            sizes="(min-width: 640px) 50vw, 100vw"
            onError={() => setBgFailed(true)}
          />
        ) : (
          <CartelDeCampoFondo />
        )}
        <div className="absolute inset-0 bg-oliva-dd/10" />
        <div className="relative flex w-full max-w-[300px] flex-col items-center sm:max-w-[240px]">
          {/* Cartel: dos postes + travesaño del que "cuelga" el tablero con el flyer */}
          <div
            className="absolute -top-4 left-1/2 h-[3px] w-[calc(100%+30px)] -translate-x-1/2 rounded-full bg-nogal shadow-sm"
            aria-hidden
          />
          <div className="absolute -top-4 bottom-1 left-0 w-[3px] -translate-x-[15px] rounded-full bg-nogal" aria-hidden />
          <div className="absolute -top-4 bottom-1 right-0 w-[3px] translate-x-[15px] rounded-full bg-nogal" aria-hidden />
          <span className="absolute -top-4 left-3 h-4 w-px bg-nogal/70" aria-hidden />
          <span className="absolute -top-4 right-3 h-4 w-px bg-nogal/70" aria-hidden />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-oliva-dd px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-dorado shadow">
            Origen El Doradillo
          </div>

          <div className="relative aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-md border-[3px] border-dorado bg-hueso-2 shadow-xl sm:max-w-[240px]">
            {a.imagen && !imgFailed ? (
              <Image
                src={a.imagen}
                alt={a.titulo}
                fill
                className="object-contain"
                sizes="(min-width: 640px) 240px, 300px"
                priority={priority}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <i className="ti ti-photo-off text-4xl text-piedra" aria-hidden />
              </div>
            )}
          </div>
          <div className="mt-2 h-1.5 w-[70%] max-w-[220px] rounded-full bg-black/25 blur-[2px]" aria-hidden />
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
  );
}

function FullBannerSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cta = buildCta(a);

  return (
    <SlideLink cta={cta} className="relative block h-44 w-full sm:h-64">
      {a.imagen && !imgFailed ? (
        <Image
          src={a.imagen}
          alt={a.titulo}
          fill
          className="object-cover"
          sizes="100vw"
          priority={priority}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <DefaultFondo />
      )}
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
  );
}

function BackgroundImageSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cta = buildCta(a);
  const bg = a.backgroundImagen || a.imagen;

  return (
    <SlideLink cta={cta} className="relative block h-52 w-full sm:h-72">
      {bg && !imgFailed ? (
        <Image
          src={bg}
          alt=""
          aria-hidden
          fill
          className="object-cover"
          sizes="100vw"
          priority={priority}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <DefaultFondo />
      )}
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
  );
}

function TextOnlySlide({ a }: SlideProps) {
  const cta = buildCta(a);

  return (
    <SlideLink
      cta={cta}
      className="flex min-h-[176px] flex-col items-start justify-center gap-2 bg-oliva-dd px-5 py-6 sm:min-h-[220px] sm:px-10"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-dorado/15">
        <i className={`ti ${TIPO_ICON[a.tipo]} text-xl text-dorado`} aria-hidden />
      </div>
      <TipoBadge tipo={a.tipo} variant="solid" />
      <h3 className="font-slab text-lg font-semibold leading-tight text-white sm:text-xl">{a.titulo}</h3>
      <p className="max-w-[560px] text-[13px] leading-relaxed text-white/85 sm:text-[13.5px]">{a.descripcion}</p>
      <FechaLugar a={a} />
      {cta && <CtaButton cta={cta} />}
    </SlideLink>
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
