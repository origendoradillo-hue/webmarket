"use client";

import { useEffect, useState } from "react";
import { Anuncio, TipoAnuncio } from "@/lib/types";

const TIPO_ICON: Record<TipoAnuncio, string> = {
  evento: "ti-calendar-event",
  aviso_barrial: "ti-alert-triangle",
  sponsor: "ti-award",
  promocion: "ti-discount-2",
  comunicado: "ti-speakerphone",
  feria: "ti-shopping-bag",
  novedad: "ti-sparkles",
};

interface AnuncioTickerProps {
  anuncios: Anuncio[];
}

// Cinta chica y rotativa para pantallas que no son el inicio — a diferencia
// de AnuncioCarousel, no necesita foto: es solo un ícono + título.
export default function AnuncioTicker({ anuncios }: AnuncioTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= anuncios.length) setIndex(0);
  }, [anuncios.length, index]);

  useEffect(() => {
    if (anuncios.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % anuncios.length), 6000);
    return () => clearInterval(timer);
  }, [anuncios.length]);

  if (anuncios.length === 0) return null;

  const a = anuncios[index];
  const content = (
    <>
      <i className={`ti ${TIPO_ICON[a.tipo]} flex-shrink-0 text-base text-dorado`} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-hueso">{a.titulo}</span>
    </>
  );

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg bg-oliva-dd px-3 py-2">
      {a.ctaUrl ? (
        <a href={a.ctaUrl} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2">
          {content}
          <i className="ti ti-chevron-right flex-shrink-0 text-sm text-dorado" aria-hidden />
        </a>
      ) : (
        content
      )}
    </div>
  );
}
