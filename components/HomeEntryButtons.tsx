"use client";

interface HomeEntryButtonsProps {
  onExplorar: () => void;
  onOfrezco: () => void;
  onBusco: () => void;
  onPublicar: () => void;
}

export default function HomeEntryButtons({ onExplorar, onOfrezco, onBusco, onPublicar }: HomeEntryButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:px-7">
      <button
        type="button"
        onClick={onExplorar}
        className="cursor-pointer rounded-xl border-2 border-piedra/70 bg-white px-4 py-4 text-center font-slab text-sm font-semibold text-tinta shadow-sm transition active:scale-[0.97]"
      >
        <i className="ti ti-compass mb-1 block text-xl text-oliva" aria-hidden />
        <span>Estoy mirando</span>
      </button>
      <button
        type="button"
        onClick={onPublicar}
        className="cursor-pointer rounded-xl bg-dorado px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-sm transition active:scale-[0.97]"
      >
        <i className="ti ti-plus mb-1 block text-xl" aria-hidden />
        <span>Publicar</span>
      </button>
      <button
        type="button"
        onClick={onOfrezco}
        className="cursor-pointer rounded-xl bg-oliva px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-sm transition active:scale-[0.97]"
      >
        <i className="ti ti-tag mb-1 block text-xl" aria-hidden />
        <span>Se ofrece</span>
      </button>
      <button
        type="button"
        onClick={onBusco}
        className="cursor-pointer rounded-xl bg-golfo px-4 py-4 text-center font-slab text-sm font-semibold text-hueso shadow-sm transition active:scale-[0.97]"
      >
        <i className="ti ti-search mb-1 block text-xl" aria-hidden />
        <span>Se busca</span>
      </button>
    </div>
  );
}
