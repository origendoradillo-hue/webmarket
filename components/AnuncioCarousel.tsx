"use client";

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
  if (anuncios.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto bg-oliva-d/10 px-4 py-4 sm:px-7">
      {anuncios.map((a) => (
        <div key={a.id} className="w-[260px] flex-shrink-0 overflow-hidden rounded-xl border border-piedra/50 bg-white">
          <div className="relative h-32 bg-oliva-dd">
            {a.imagen ? (
              <Image src={a.imagen} alt={a.titulo} fill className="object-cover" sizes="260px" />
            ) : (
              <i className="ti ti-speakerphone absolute inset-0 m-auto flex h-8 w-8 items-center justify-center text-3xl text-dorado" aria-hidden />
            )}
            <span className="absolute left-2 top-2 rounded-full bg-oliva-dd/80 px-2 py-1 text-[9px] font-medium text-hueso">
              {TIPO_LABEL[a.tipo]}
            </span>
          </div>
          <div className="p-3">
            <h3 className="mb-1 font-slab text-sm font-semibold leading-tight text-tinta">{a.titulo}</h3>
            <p className="line-clamp-2 text-[11.5px] text-piedra">{a.descripcion}</p>
            {(a.fechaEvento || a.lugar) && (
              <p className="mt-1.5 text-[10.5px] text-golfo">
                {a.fechaEvento ? new Date(a.fechaEvento).toLocaleDateString("es-AR") : ""}
                {a.fechaEvento && a.lugar ? " · " : ""}
                {a.lugar}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
