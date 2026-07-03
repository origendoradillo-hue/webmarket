"use client";

import { useCategories } from "@/lib/useCategories";
import { CategoryKey } from "@/lib/types";

interface CategoryFiltersProps {
  cat: CategoryKey | "all";
  sub: string | "all";
  onSelectCat: (cat: CategoryKey | "all") => void;
  onSelectSub: (sub: string | "all") => void;
}

export default function CategoryFilters({ cat, sub, onSelectCat, onSelectSub }: CategoryFiltersProps) {
  const { categories } = useCategories();
  const catEntries = Object.entries(categories);

  return (
    <div className="px-4 pt-4 sm:px-7 sm:pt-5">
      <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-1">
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
        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto border-b border-piedra/50 pb-4">
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
