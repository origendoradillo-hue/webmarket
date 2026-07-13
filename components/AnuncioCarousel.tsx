"use client";

import { useEffect, useState } from "react";
import { Anuncio } from "@/lib/types";
import AnuncioSlide from "./AnuncioSlide";

interface AnuncioCarouselProps {
  anuncios: Anuncio[];
}

export default function AnuncioCarousel({ anuncios }: AnuncioCarouselProps) {
  const [index, setIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (index >= anuncios.length) setIndex(0);
  }, [anuncios.length, index]);

  useEffect(() => {
    if (anuncios.length < 2 || detailOpen) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % anuncios.length), 9000);
    return () => clearInterval(timer);
  }, [anuncios.length, detailOpen]);

  if (anuncios.length === 0) return null;

  const a = anuncios[index];

  function prev() {
    setIndex((i) => (i - 1 + anuncios.length) % anuncios.length);
  }
  function next() {
    setIndex((i) => (i + 1) % anuncios.length);
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-oliva-dd shadow-sm ring-1 ring-dorado/40">
      <p className="flex items-center gap-1.5 bg-oliva-d px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-dorado sm:px-8">
        <i className="ti ti-speakerphone text-sm" aria-hidden />
        Anuncios y novedades de la comunidad
      </p>

      <div className="relative">
        <AnuncioSlide anuncio={a} priority={index === 0} onDetailOpenChange={setDetailOpen} />

        {anuncios.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Anuncio anterior"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <i className="ti ti-chevron-left text-lg" aria-hidden />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente anuncio"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <i className="ti ti-chevron-right text-lg" aria-hidden />
            </button>
          </>
        )}
      </div>

      {anuncios.length > 1 && (
        <div className="flex justify-center gap-1.5 bg-oliva-dd py-2.5">
          {anuncios.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir al anuncio ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-dorado" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
