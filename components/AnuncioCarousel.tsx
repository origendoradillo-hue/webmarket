"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Anuncio, TipoAnuncio } from "@/lib/types";

const TIPO_LABEL: Record<TipoAnuncio, string> = {
  evento: "Evento",
  aviso_barrial: "Aviso barrial",
  sponsor: "Sponsor",
  promocion: "Promoción",
  comunicado: "Comunicado",
  feria: "Feria",
  novedad: "Novedad",
};

interface AnuncioCarouselProps {
  anuncios: Anuncio[];
}

export default function AnuncioCarousel({ anuncios }: AnuncioCarouselProps) {
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

  function prev() {
    setIndex((i) => (i - 1 + anuncios.length) % anuncios.length);
  }
  function next() {
    setIndex((i) => (i + 1) % anuncios.length);
  }

  return (
    <div className="relative w-full overflow-hidden bg-oliva-dd">
      <div className="relative h-44 w-full sm:h-64">
        {a.imagen ? (
          <Image src={a.imagen} alt={a.titulo} fill className="object-cover" sizes="100vw" priority={index === 0} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="ti ti-speakerphone text-5xl text-dorado/80" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        <span className="absolute left-3 top-3 rounded-full bg-dorado px-2.5 py-1 text-[10px] font-semibold text-oliva-dd">
          {TIPO_LABEL[a.tipo]}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h3 className="font-slab text-base font-semibold leading-tight text-white sm:text-lg">{a.titulo}</h3>
          <p className="mt-1 line-clamp-2 max-w-[560px] text-[12px] text-white/85 sm:text-[13px]">{a.descripcion}</p>
          {(a.fechaEvento || a.lugar) && (
            <p className="mt-1.5 text-[11px] font-medium text-dorado">
              {a.fechaEvento ? new Date(a.fechaEvento).toLocaleDateString("es-AR", { timeZone: "UTC" }) : ""}
              {a.fechaEvento && a.lugar ? " · " : ""}
              {a.lugar}
            </p>
          )}
        </div>

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
