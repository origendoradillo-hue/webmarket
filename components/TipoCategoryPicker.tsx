"use client";

import { TipoPublicacion } from "@/lib/types";

const TIPOS: { value: TipoPublicacion; label: string; icon: string }[] = [
  { value: "producto", label: "Productos", icon: "ti-box" },
  { value: "servicio", label: "Servicios", icon: "ti-tools" },
  { value: "experiencia", label: "Experiencias", icon: "ti-compass" },
  { value: "inmueble", label: "Inmuebles", icon: "ti-home" },
  { value: "usado", label: "Usados", icon: "ti-recycle" },
  { value: "herramienta", label: "Herramientas", icon: "ti-hammer" },
];

interface TipoCategoryPickerProps {
  intencion: "ofrezco" | "busco";
  onSelect: (t: TipoPublicacion) => void;
}

export default function TipoCategoryPicker({ intencion, onSelect }: TipoCategoryPickerProps) {
  return (
    <div className="pt-2">
      <p className="mb-1 font-slab text-lg font-semibold text-tinta">
        {intencion === "ofrezco" ? "¿Qué se ofrece?" : "¿Qué se busca?"}
      </p>
      <p className="mb-4 text-[13px] text-tinta-suave">Elegí una categoría para ver resultados</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className="rounded-lg border border-piedra/70 p-3.5 text-center hover:border-oliva"
          >
            <i className={`ti ${t.icon} mb-2 block text-2xl text-oliva`} aria-hidden />
            <span className="text-[13px] font-medium text-tinta">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
