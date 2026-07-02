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
        onClick={onExplorar}
        className="rounded-xl border border-piedra/70 bg-white px-4 py-4 text-center font-slab text-sm font-semibold text-tinta"
      >
        <i className="ti ti-compass mb-1 block text-xl text-oliva" aria-hidden /> Estoy mirando
      </button>
      <button
        onClick={onPublicar}
        className="rounded-xl bg-dorado px-4 py-4 text-center font-slab text-sm font-semibold text-hueso"
      >
        <i className="ti ti-plus mb-1 block text-xl" aria-hidden /> Publicar
      </button>
      <button
        onClick={onOfrezco}
        className="rounded-xl bg-oliva px-4 py-4 text-center font-slab text-sm font-semibold text-hueso"
      >
        <i className="ti ti-tag mb-1 block text-xl" aria-hidden /> Se ofrece
      </button>
      <button
        onClick={onBusco}
        className="rounded-xl bg-golfo px-4 py-4 text-center font-slab text-sm font-semibold text-hueso"
      >
        <i className="ti ti-search mb-1 block text-xl" aria-hidden /> Se busca
      </button>
    </div>
  );
}
