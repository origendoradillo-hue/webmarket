"use client";

import Image from "next/image";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export default function Hero({ query, onQueryChange }: HeroProps) {
  return (
    <div className="bg-oliva-dd px-5 pb-8 pt-9 text-center sm:px-8 sm:pb-10 sm:pt-14">
      <h1 className="sr-only">Origen El Doradillo</h1>
      <Image
        src="/brand/logo-completo.png"
        alt="Origen El Doradillo"
        width={360}
        height={140}
        className="mx-auto mb-2 h-auto w-[140px] sm:w-[180px]"
        priority
      />
      <p className="mx-auto mb-5 max-w-[560px] text-[13.5px] leading-relaxed text-hueso/85 sm:mb-6 sm:text-[15.5px]">
        Productos, servicios y experiencias con origen en la zona rural norte de Madryn.
      </p>
      <div className="mx-auto flex max-w-[480px] gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="¿Qué estás buscando en El Doradillo?"
          className="flex-1 rounded-lg border-none px-3.5 py-3 font-sans text-sm text-tinta outline-none"
        />
        <button
          aria-label="Buscar"
          className="rounded-lg bg-dorado px-4 font-semibold text-oliva-dd"
        >
          <i className="ti ti-search text-lg" aria-hidden />
        </button>
      </div>
    </div>
  );
}
