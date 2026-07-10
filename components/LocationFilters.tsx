"use client";

import { useCategories } from "@/lib/useCategories";
import { Cuadrante } from "@/lib/types";

const CUADRANTES: Cuadrante[] = ["Norte", "Sur", "Este", "Oeste"];

interface LocationFiltersProps {
  zona: string | "all";
  cuadrante: Cuadrante | "all";
  onSelectZona: (zona: string | "all") => void;
  onSelectCuadrante: (cuadrante: Cuadrante | "all") => void;
}

export default function LocationFilters({ zona, cuadrante, onSelectZona, onSelectCuadrante }: LocationFiltersProps) {
  const { zones } = useCategories();

  return (
    <div className="px-4 pt-1 sm:px-7">
      <div className="mb-2 flex flex-wrap gap-1.5 pb-1">
        <button
          onClick={() => onSelectZona("all")}
          className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 font-sans text-[11px] ${
            zona === "all" ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 bg-white text-nogal"
          }`}
        >
          <i className="ti ti-map-pin text-[12px]" aria-hidden /> Todas las zonas
        </button>
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => onSelectZona(z)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 font-sans text-[11px] ${
              zona === z ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 bg-white text-nogal"
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {zona !== "all" && (
        <div className="mb-4 flex flex-wrap gap-1 border-b border-piedra/50 pb-4">
          <button
            onClick={() => onSelectCuadrante("all")}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${
              cuadrante === "all" ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
            }`}
          >
            Todos los cuadrantes
          </button>
          {CUADRANTES.map((c) => (
            <button
              key={c}
              onClick={() => onSelectCuadrante(c)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${
                cuadrante === c ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
