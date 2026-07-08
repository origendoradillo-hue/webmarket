"use client";

import { useCategories } from "@/lib/useCategories";
import { CategoryKey, TipoPublicacion } from "@/lib/types";

interface CategoryFiltersProps {
  cat: CategoryKey | "all";
  sub: string | "all";
  onSelectCat: (cat: CategoryKey | "all") => void;
  onSelectSub: (sub: string | "all") => void;
  tipoFilter?: TipoPublicacion | "all";
}

export default function CategoryFilters({ cat, sub, onSelectCat, onSelectSub, tipoFilter = "all" }: CategoryFiltersProps) {
  const { categories } = useCategories();
  const catEntries = Object.entries(categories).filter(([, c]) => tipoFilter === "all" || c.tipoScope.includes(tipoFilter));

  return (
    <div className="px-4 pt-4 sm:px-7 sm:pt-5">
      <div className="mb-2.5 flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => onSelectCat("all")}
          className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 font-sans text-[13px] ${
            cat === "all" ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 bg-white text-nogal"
          }`}
        >
          <i className="ti ti-apps" aria-hidden /> Todas
        </button>
        {catEntries.map(([key, c]) => (
          <button
            key={key}
            onClick={() => onSelectCat(key)}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 font-sans text-[13px] ${
              cat === key ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 bg-white text-nogal"
            }`}
          >
            <i className={`ti ${c.icon}`} aria-hidden /> {c.label}
          </button>
        ))}
      </div>

      {cat !== "all" && categories[cat] && (
        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-piedra/50 pb-4">
          <button
            onClick={() => onSelectSub("all")}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
              sub === "all" ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
            }`}
          >
            Todas las subcategorías
          </button>
          {categories[cat].subs.map((s) => (
            <button
              key={s}
              onClick={() => onSelectSub(s)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
                sub === s ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
