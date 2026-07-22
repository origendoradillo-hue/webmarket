"use client";

import { useEffect, useRef, useState } from "react";

interface FilterDropdownProps {
  label: string;
  activeLabel?: string;
  children: React.ReactNode;
}

// Pill chico que abre un panel flotante con las opciones adentro (mismo
// contenido que ya existía, solo que ahora colapsado) — así los 4 grupos
// de filtros caben en una sola fila horizontal en vez de apilarse y
// ocupar toda la pantalla en celular.
export default function FilterDropdown({ label, activeLabel, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isActive = !!activeLabel;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
          isActive ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta"
        }`}
      >
        {activeLabel || label}
        <i className={`ti ti-chevron-down text-xs transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 max-h-[70vh] w-max min-w-[220px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-piedra/30 bg-white p-3 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
