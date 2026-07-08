"use client";

interface HomeEntryButtonsProps {
  onExplorar: () => void;
  onOfrezco: () => void;
  onBusco: () => void;
  onPublicar: () => void;
}

export default function HomeEntryButtons({ onExplorar, onOfrezco, onBusco, onPublicar }: HomeEntryButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-5 sm:px-7 sm:pt-6">
      <button
        type="button"
        onClick={onExplorar}
        className="cursor-pointer rounded-xl border-2 border-piedra/70 border-b-4 bg-white px-4 py-4 text-center font-slab text-sm font-semibold text-tinta shadow-md transition hover:-translate-y-0.5 hover:border-oliva hover:shadow-lg active:translate-y-0 active:border-b-2"
      >
        <i className="ti ti-compass mb-1 block text-xl text-oliva" aria-hidden />
        <span>Estoy mirando</span>
        <span className="mt-0.5 block text-[10.5px] font-normal text-tinta-suave">Explorá todo lo que hay</span>
      </button>
      <button
        type="button"
        onClick={onPublicar}
        className="cursor-pointer rounded-xl border-b-4 border-black/15 bg-dorado px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105 active:translate-y-0 active:border-b-2"
      >
        <i className="ti ti-plus mb-1 block text-xl" aria-hidden />
        <span>Publicar</span>
        <span className="mt-0.5 block text-[10.5px] font-normal text-hueso/80">Gratis y al instante</span>
      </button>
      <button
        type="button"
        onClick={onOfrezco}
        className="cursor-pointer rounded-xl border-b-4 border-black/15 bg-oliva px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:translate-y-0 active:border-b-2"
      >
        <i className="ti ti-tag mb-1 block text-xl" aria-hidden />
        <span>Se ofrece</span>
        <span className="mt-0.5 block text-[10.5px] font-normal text-hueso/80">Productos y servicios</span>
      </button>
      <button
        type="button"
        onClick={onBusco}
        className="cursor-pointer rounded-xl border-b-4 border-black/15 bg-golfo px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:translate-y-0 active:border-b-2"
      >
        <i className="ti ti-search mb-1 block text-xl" aria-hidden />
        <span>Se busca</span>
        <span className="mt-0.5 block text-[10.5px] font-normal text-hueso/80">Pedí lo que necesitás</span>
      </button>
    </div>
  );
}
