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

function FechaLugar({ a, light }: { a: Anuncio; light?: boolean }) {
  if (!a.fechaEvento && !a.lugar) return null;
  return (
    <p className={`text-[11.5px] font-medium ${light ? "text-dorado" : "text-dorado"}`}>
      {a.fechaEvento ? new Date(a.fechaEvento).toLocaleDateString("es-AR", { timeZone: "UTC" }) : ""}
      {a.fechaEvento && a.lugar ? " · " : ""}
      {a.lugar}
    </p>
  );
}

function CtaButton({ cta }: { cta: Cta }) {
  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-dorado px-4 py-2 text-[12.5px] font-semibold text-oliva-dd transition hover:brightness-95"
    >
      {cta.label}
      <i className="ti ti-arrow-right text-sm" aria-hidden />
    </a>
  );
}

function FlyerOnSignSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const cta = buildCta(a);

  return (
    <div className="grid sm:grid-cols-2">
      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-oliva-d via-oliva to-oliva-dd px-6 py-7 sm:py-10">
        {a.backgroundImagen && !bgFailed && (
          <Image
            src={a.backgroundImagen}
            alt=""
            aria-hidden
            fill
            className="object-cover"
            sizes="(min-width: 640px) 50vw, 100vw"
            onError={() => setBgFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-oliva-dd/25" />
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-md border-[3px] border-dorado bg-hueso-2 shadow-xl sm:max-w-[240px]">
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
      </div>

      <div className="flex flex-col justify-center gap-2 bg-hueso-2 px-5 py-5 sm:px-8 sm:py-7">
        <TipoBadge tipo={a.tipo} />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta sm:text-xl">{a.titulo}</h3>
        <p className="text-[13px] leading-relaxed text-tinta-suave sm:text-[13.5px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </div>
  );
}

function FullBannerSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cta = buildCta(a);

  return (
    <div className="relative h-44 w-full sm:h-64">
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
        <div className="absolute inset-0 flex items-center justify-center bg-oliva-dd">
          <i className="ti ti-speakerphone text-5xl text-dorado/80" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute left-3 top-3">
        <TipoBadge tipo={a.tipo} variant="solid" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <h3 className="font-slab text-base font-semibold leading-tight text-white sm:text-lg">{a.titulo}</h3>
        <p className="mt-1 line-clamp-2 max-w-[560px] text-[12px] text-white/85 sm:text-[13px]">{a.descripcion}</p>
        <FechaLugar a={a} light />
        {cta && (
          <div className="mt-2">
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundImageSlide({ a, priority }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cta = buildCta(a);
  const bg = a.backgroundImagen || a.imagen;

  return (
    <div className="relative h-52 w-full sm:h-72">
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
        <div className="absolute inset-0 bg-gradient-to-br from-oliva-d via-oliva to-oliva-dd" />
      )}
      <div className="absolute inset-0 bg-oliva-dd/20" />
      <div className="absolute inset-x-3 bottom-3 max-w-[420px] rounded-xl bg-oliva-dd/92 p-4 shadow-lg sm:inset-x-auto sm:bottom-6 sm:left-6">
        <TipoBadge tipo={a.tipo} variant="solid" />
        <h3 className="mt-1.5 font-slab text-base font-semibold leading-tight text-white sm:text-lg">{a.titulo}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] text-white/85 sm:text-[13px]">{a.descripcion}</p>
        <FechaLugar a={a} light />
        {cta && (
          <div className="mt-2">
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </div>
  );
}

function TextOnlySlide({ a }: SlideProps) {
  const cta = buildCta(a);

  return (
    <div className="flex min-h-[176px] flex-col items-start justify-center gap-2 bg-oliva-dd px-5 py-6 sm:min-h-[220px] sm:px-10">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-dorado/15">
        <i className={`ti ${TIPO_ICON[a.tipo]} text-xl text-dorado`} aria-hidden />
      </div>
      <TipoBadge tipo={a.tipo} variant="solid" />
      <h3 className="font-slab text-lg font-semibold leading-tight text-white sm:text-xl">{a.titulo}</h3>
      <p className="max-w-[560px] text-[13px] leading-relaxed text-white/85 sm:text-[13.5px]">{a.descripcion}</p>
      <FechaLugar a={a} light />
      {cta && <CtaButton cta={cta} />}
    </div>
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
