"use client";

import { useState } from "react";
import Image from "next/image";
import { Anuncio, AnuncioLayoutType, TipoAnuncio } from "@/lib/types";
import { SITE_URL } from "@/lib/seo";
import ShareButton from "./ShareButton";

export const TIPO_LABEL: Record<TipoAnuncio, string> = {
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
  onDetailOpenChange?: (open: boolean) => void;
  // Las vistas previas (grilla de formatos, panel "Así se ve" del editor de
  // recorte) escalan el slide con un transform CSS para mostrarlo chico —
  // pero `sm:` de Tailwind mira el ancho REAL de la ventana, no el tamaño
  // visual ya escalado. En una pantalla de escritorio (lo más común para
  // administrar el sitio) esto hacía que la vista previa mostrara el
  // layout de desktop apretado adentro de una cajita chica — una imagen
  // angosta o directamente rota, en vez de cómo se ve en un celular real.
  // Este flag apaga las clases `sm:` que cambian la estructura, para que
  // la vista previa siempre muestre el armado de mobile sin importar el
  // ancho de la ventana del admin.
  forceMobile?: boolean;
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

function ImageZoomOverlay({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
      >
        <i className="ti ti-x text-xl" aria-hidden />
      </button>
      {/* object-contain a pantalla completa para poder leer flyers con
          mucho texto — el zoom nativo (pinch/doble tap) del navegador
          sigue funcionando encima porque el viewport no lo bloquea. */}
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

function AnuncioDetailModal({ a, onClose }: { a: Anuncio; onClose: () => void }) {
  const cta = buildCta(a);
  const imgSrc = a.imagen || a.backgroundImagen;
  const [zoomOpen, setZoomOpen] = useState(false);

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
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Ver imagen más grande"
              className="relative block aspect-[4/3] w-full bg-hueso-2"
            >
              <Image src={imgSrc} alt={a.titulo} fill className="object-contain" sizes="480px" />
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                <i className="ti ti-zoom-in text-sm" aria-hidden />
                Ampliar
              </span>
            </button>
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
            {a.whatsappNumero && (
              <a
                href={`https://wa.me/${a.whatsappNumero.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:brightness-95"
              >
                <i className="ti ti-brand-whatsapp text-base" aria-hidden />
                Consultar por WhatsApp
              </a>
            )}
            {a.redesUrl && (
              <a
                href={a.redesUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-piedra/60 px-4 py-2 text-[12.5px] font-semibold text-tinta transition hover:bg-hueso-2"
              >
                <i className="ti ti-world text-base" aria-hidden />
                Ver en redes
              </a>
            )}
            <ShareButton
              url={a.shortCode ? `${SITE_URL}/p/${a.shortCode}` : `${SITE_URL}/anuncio/${a.id}`}
              title={a.titulo}
              text={a.descripcion.slice(0, 120)}
              imageUrl={a.imagen || a.backgroundImagen}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-piedra/60 px-4 py-2 text-[12.5px] font-semibold text-tinta"
              label="Compartir"
            />
          </div>
        </div>
      </div>
      {zoomOpen && imgSrc && <ImageZoomOverlay src={imgSrc} alt={a.titulo} onClose={() => setZoomOpen(false)} />}
    </div>
  );
}

// Fondo institucional por defecto — foto real de la estepa patagónica,
// para flyer_on_sign / full_banner cuando el admin todavía no cargó una
// imagen propia.
const FONDO_ESTEPA = "/brand/anuncio-fondo-estepa.png";
const CARTEL_COLGANTE = "/brand/cartel-colgante.png";

// Rectángulo (medido en la imagen fuente, 1122x1402px, con un flood-fill
// desde el centro del recorte de croma, más 20px de margen hacia adentro
// en cada lado) donde va el flyer del usuario — el margen es a propósito
// para que el flyer nunca llegue a pisar el marco de madera del cartel,
// aunque la foto no calce perfecto con el hueco medido.
const CARTEL_FLYER_RECT = { left: "16.49%", top: "19.61%", width: "64.44%", height: "67.40%" };

// Proporción real del rect de arriba — se usa para forzar el recorte del
// flyer a esta relación de aspecto antes de subirlo, así encaja justo en
// el panel sin franjas vacías arriba/abajo.
export const CARTEL_FLYER_ASPECT = 723 / 945;

// Referencia para el recorte de la foto del layout "full_banner" — el
// mismo 375×360 (ancho de celular típico × alto real del carrusel en
// mobile, ver AnuncioCarousel.tsx) que ya usa AnuncioSlidePreviewFrame,
// así lo que se recorta en el editor coincide con cómo se ve publicado.
export const BANNER_ASPECT = 375 / 360;

// El alto real lo fija el contenedor del carrusel (AnuncioCarousel.tsx,
// alto fijo, no min-h). Cada formato solo tiene que llenarlo del todo
// (h-full) y recortar/scrollear lo que no entre — así los 4 formatos
// quedan siempre exactamente iguales de tamaño, sin depender de cuánto
// contenido tenga cada anuncio puntual.
const SLIDE_HEIGHT = "h-full";

function FlyerBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-oliva/15 px-2.5 py-1 text-[10.5px] font-semibold text-oliva">
      <i className="ti ti-photo text-xs" aria-hidden />
      Flyer vertical integrado
    </span>
  );
}

function FlyerOnSignSlide({ a, priority, onDetailOpenChange, forceMobile }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);

  return (
    <>
    <SlideLink
      onOpen={() => {
        setDetailOpen(true);
        onDetailOpenChange?.(true);
      }}
      className={`flex flex-col overflow-hidden ${forceMobile ? "" : "sm:grid sm:grid-cols-2"} ${SLIDE_HEIGHT}`}
    >
      {/* min-h-0: por default un ítem de grid no se achica más que el alto
          "natural" de lo que tiene adentro (min-height: auto), así que sin
          esto en desktop (sm:grid) esta columna terminaba más alta que los
          420px del carrusel real — se veía tapado por el overflow-hidden
          de afuera, pero el recorte de la foto de fondo se calculaba mal
          igual, porque object-cover encuadra según el alto real de la caja. */}
      <div className={`relative flex h-[170px] min-h-0 shrink-0 items-center justify-center overflow-hidden p-4 ${forceMobile ? "" : "sm:h-full sm:p-6"}`}>
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
            usuario se compone sobre el hueco del PNG, en el rectángulo
            exacto medido en CARTEL_FLYER_RECT. Alto 100% del bloque de
            imagen (no un px fijo), así nunca empuja el slide entero a ser
            más alto que los otros 3 formatos. */}
        <div className="relative h-full" style={{ aspectRatio: "1122 / 1402" }}>
          <Image src={CARTEL_COLGANTE} alt="" aria-hidden fill className="object-contain" sizes="380px" />
          <div
            className="absolute overflow-hidden rounded-sm bg-black"
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

      <div className="flex flex-1 flex-col justify-center gap-1.5 overflow-y-auto bg-hueso-2 px-5 py-4 sm:px-8 sm:py-7">
        <FlyerBadge />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta sm:text-xl">{a.titulo}</h3>
        <p className="text-[12.5px] leading-relaxed text-tinta-suave sm:text-[13.5px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </SlideLink>
    {detailOpen && (
      <AnuncioDetailModal
        a={a}
        onClose={() => {
          setDetailOpen(false);
          onDetailOpenChange?.(false);
        }}
      />
    )}
    </>
  );
}

function FullBannerSlide({ a, priority, onDetailOpenChange, forceMobile }: SlideProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);
  // Antes flyer_on_sign/full_banner/background_image tenían 3 fuentes de
  // imagen ligeramente distintas, con full_banner e background_image
  // terminando visualmente casi idénticos (misma foto de fondo con texto
  // superpuesto). Se fusionaron en un solo layout: prioriza
  // backgroundImagen (así los anuncios ex-background_image no pierden su
  // foto), cae a imagen para los full_banner viejos que solo tenían eso.
  const bg = a.backgroundImagen || a.imagen;

  return (
    <>
    <SlideLink
      onOpen={() => {
        setDetailOpen(true);
        onDetailOpenChange?.(true);
      }}
      className={`relative block w-full overflow-hidden ${forceMobile ? "" : "sm:grid sm:grid-cols-2"} ${SLIDE_HEIGHT}`}
    >
      {/* Una foto pensada para un carrusel angosto de celular queda muy
          estirada/recortada en uno mucho más ancho de PC — en mobile es
          foto a pantalla completa con una placa de texto flotante (un solo
          blur, no una franja de degradado + blur separados); en desktop
          pasa a ser foto a la izquierda y un panel de texto sólido aparte
          a la derecha (sin blur, más legible), mismo criterio que el
          layout del cartel. */}
      {/* min-h-0: sin esto, en desktop (sm:grid) esta columna crecía más
          alta que los 420px reales del carrusel (min-height: auto por
          default en un ítem de grid) — el overflow-hidden de afuera lo
          tapaba, pero object-cover encuadraba la foto según ese alto
          incorrecto, así que el recorte quedaba mal igual. */}
      <div className="relative h-full min-h-0">
        <Image
          src={bg && !imgFailed ? bg : FONDO_ESTEPA}
          alt={a.titulo}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 50vw, 100vw"
          priority={priority}
          onError={() => setImgFailed(true)}
        />
        <div className={`absolute left-3 top-3 ${forceMobile ? "" : "sm:hidden"}`}>
          <TipoBadge tipo={a.tipo} variant="solid" />
        </div>
        <div className={`absolute inset-x-3 bottom-3 rounded-xl bg-oliva-dd/90 p-4 shadow-lg backdrop-blur-sm ${forceMobile ? "" : "sm:hidden"}`}>
          <h3 className="font-slab text-base font-semibold leading-tight text-white">{a.titulo}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] text-white/85">{a.descripcion}</p>
          <FechaLugar a={a} />
          {cta && (
            <div className="mt-2">
              <CtaButton cta={cta} />
            </div>
          )}
        </div>
      </div>
      {/* overflow-y-auto: sin esto, un título/descripción largos hacían que
          esta columna pidiera más alto del que tiene el carrusel (420px) —
          y como el grid de CSS agranda toda la fila para que entre el
          contenido de cualquiera de las 2 columnas, la columna de la foto
          crecía también (se veía tapada por el overflow-hidden de afuera,
          pero el recorte de la foto se calculaba mal igual, porque
          object-cover encuadra según el alto real de su caja, no el
          visible). Los otros 2 formatos ya lo tenían. */}
      <div className={`hidden flex-col justify-center gap-2 overflow-y-auto bg-hueso-2 px-8 py-7 ${forceMobile ? "" : "sm:flex"}`}>
        <TipoBadge tipo={a.tipo} />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta">{a.titulo}</h3>
        <p className="text-[13.5px] leading-relaxed text-tinta-suave">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </SlideLink>
    {detailOpen && (
      <AnuncioDetailModal
        a={a}
        onClose={() => {
          setDetailOpen(false);
          onDetailOpenChange?.(false);
        }}
      />
    )}
    </>
  );
}

function TextOnlySlide({ a, onDetailOpenChange, forceMobile }: SlideProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const cta = buildCta(a);

  return (
    <>
    <SlideLink
      onOpen={() => {
        setDetailOpen(true);
        onDetailOpenChange?.(true);
      }}
      className={`flex flex-col overflow-hidden ${forceMobile ? "" : "sm:grid sm:grid-cols-2"} ${SLIDE_HEIGHT}`}
    >
      {/* Sin foto no hay nada que recortar/estirar por formato — en vez de
          una imagen institucional de fondo casi imperceptible (85% de
          opacidad encima), un panel de color sólido con el ícono del tipo
          de anuncio bien grande, mismo split imagen/texto que los otros 2
          layouts para que los 3 formatos compartan un lenguaje visual. */}
      <div className={`flex h-[110px] min-h-0 shrink-0 items-center justify-center bg-oliva-dd ${forceMobile ? "" : "sm:h-full"}`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dorado bg-oliva-dd/40">
          <i className={`ti ${TIPO_ICON[a.tipo]} text-3xl text-dorado`} aria-hidden />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 overflow-y-auto bg-hueso-2 px-5 py-4 sm:px-10 sm:py-7">
        <TipoBadge tipo={a.tipo} />
        <h3 className="font-slab text-lg font-semibold leading-tight text-tinta sm:text-xl">{a.titulo}</h3>
        <p className="line-clamp-3 max-w-[560px] text-[13px] leading-relaxed text-tinta-suave sm:text-[13.5px]">{a.descripcion}</p>
        <FechaLugar a={a} />
        {cta && <CtaButton cta={cta} />}
      </div>
    </SlideLink>
    {detailOpen && (
      <AnuncioDetailModal
        a={a}
        onClose={() => {
          setDetailOpen(false);
          onDetailOpenChange?.(false);
        }}
      />
    )}
    </>
  );
}

export function resolveLayout(a: Anuncio): AnuncioLayoutType {
  return a.layoutType;
}

interface AnuncioSlideProps {
  anuncio: Anuncio;
  priority: boolean;
  onDetailOpenChange?: (open: boolean) => void;
  forceMobile?: boolean;
}

export default function AnuncioSlide({ anuncio, priority, onDetailOpenChange, forceMobile }: AnuncioSlideProps) {
  switch (resolveLayout(anuncio)) {
    case "flyer_on_sign":
      return <FlyerOnSignSlide a={anuncio} priority={priority} onDetailOpenChange={onDetailOpenChange} forceMobile={forceMobile} />;
    case "text_only":
      return <TextOnlySlide a={anuncio} priority={priority} onDetailOpenChange={onDetailOpenChange} forceMobile={forceMobile} />;
    case "full_banner":
    default:
      return <FullBannerSlide a={anuncio} priority={priority} onDetailOpenChange={onDetailOpenChange} forceMobile={forceMobile} />;
  }
}
