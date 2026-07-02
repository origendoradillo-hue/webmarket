"use client";

import { TipoPublicacion } from "@/lib/types";

const TIPO_SHORTCUTS: { value: TipoPublicacion; label: string; icon: string }[] = [
  { value: "producto", label: "Productos", icon: "ti-box" },
  { value: "servicio", label: "Servicios", icon: "ti-tools" },
  { value: "experiencia", label: "Experiencias", icon: "ti-compass" },
  { value: "inmueble", label: "Lotes y chacras", icon: "ti-home" },
];

interface IntentShortcutsProps {
  onSelectIntencion: (i: "ofrezco" | "busco") => void;
  onSelectTipo: (t: TipoPublicacion) => void;
}

export default function IntentShortcuts({ onSelectIntencion, onSelectTipo }: IntentShortcutsProps) {
  return (
    <div className="px-4 pb-4 sm:px-7">
      <div className="mb-2.5 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onSelectIntencion("ofrezco")}
          className="rounded-xl bg-oliva px-4 py-3.5 text-center font-slab text-sm font-semibold text-hueso"
        >
          <i className="ti ti-tag mb-1 block text-xl" aria-hidden /> Ofrezco
        </button>
        <button
          onClick={() => onSelectIntencion("busco")}
          className="rounded-xl bg-golfo px-4 py-3.5 text-center font-slab text-sm font-semibold text-hueso"
        >
          <i className="ti ti-search mb-1 block text-xl" aria-hidden /> Busco
        </button>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TIPO_SHORTCUTS.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelectTipo(t.value)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-piedra/70 bg-white px-3.5 py-2 text-xs text-nogal"
          >
            <i className={`ti ${t.icon} text-oliva`} aria-hidden /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
