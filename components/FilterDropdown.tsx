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
// ocupar toda la pantalla en celular. Cada chip ocupa una fracción igual
// del ancho disponible (en vez de su ancho de contenido) para que los 4
// entren siempre en el ancho de la pantalla sin scroll lateral, sea cual
// sea el modelo de celular — el texto se trunca si no entra.
export default function FilterDropdown({ label, activeLabel, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      // La fila de chips hace scroll horizontal (varios filtros no entran
      // todos en el ancho de un celular) — un panel `absolute` queda
      // recortado por ese scroll aunque mida bien, porque `overflow-x:
      // auto` fuerza a `overflow-y` a comportarse igual (recorta en las
      // dos direcciones, no solo la horizontal). `fixed`, posicionado a
      // mano según dónde está el botón, no depende del contenedor con
      // scroll y se ve completo siempre.
      const rect = btnRef.current.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - 16 - 220);
      setCoords({ top: rect.bottom + 8, left: Math.max(16, left) });
    }
    setOpen((o) => !o);
  }

  const isActive = !!activeLabel;

  return (
    <div className="relative min-w-0 flex-1" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex w-full min-w-0 items-center justify-center gap-px rounded-full border px-0.5 py-1 text-[8px] leading-tight ${
          isActive ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta"
        }`}
      >
        <span className="min-w-0 truncate">{activeLabel || label}</span>
        <i className={`ti ti-chevron-down flex-shrink-0 text-[7px] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && coords && (
        <div
          ref={popRef}
          style={{ position: "fixed", top: coords.top, left: coords.left }}
          className="z-50 max-h-[70vh] w-max min-w-[220px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-piedra/30 bg-white p-2.5 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
