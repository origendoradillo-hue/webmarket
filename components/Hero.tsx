"use client";

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
}

export default function Hero({ query, onQueryChange, onSearch }: HeroProps) {
  return (
    <div className="bg-oliva-dd px-5 pb-8 pt-9 text-center sm:px-8 sm:pb-10 sm:pt-14">
      <h1 className="sr-only">Origen El Doradillo</h1>
      <p className="mx-auto mb-5 max-w-[560px] text-[13.5px] leading-relaxed text-hueso/85 sm:mb-6 sm:text-[15.5px]">
        Una plataforma local pensada para conectar a la comunidad de El Doradillo. Un espacio
        donde vecinos, emprendedores y prestadores de servicios publican y encuentran productos,
        servicios, experiencias, inmuebles, artículos usados, y se enteran de eventos y
        actividades de la zona.
      </p>
      <form
        className="mx-auto flex max-w-[480px] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="¿Qué estás buscando en El Doradillo?"
          className="flex-1 rounded-lg border-none px-3.5 py-3 font-sans text-sm text-tinta outline-none"
        />
        <button type="submit" aria-label="Buscar" className="rounded-lg bg-dorado px-4 font-semibold text-oliva-dd">
          <i className="ti ti-search text-lg" aria-hidden />
        </button>
      </form>
    </div>
  );
}
