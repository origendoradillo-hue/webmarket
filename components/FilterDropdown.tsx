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
      // El panel tiene ancho variable según el contenido (w-max, puede
      // llegar a ocupar casi toda la pantalla si hay muchas categorías) —
      // no se puede saber su ancho final antes de renderizarlo, así que
      // calcular el borde izquierdo "cerca del botón" con un ancho
      // supuesto (ej. 220px) lo mandaba afuera de la pantalla para los
      // chips de la derecha (Ubicación, Orden) cuando terminaba siendo
      // más ancho que eso. Ahora se ancla siempre al mismo margen
      // izquierdo que ya usa la fila de filtros — junto con
      // max-w-[calc(100vw-2rem)] en el panel, el borde derecho nunca
      // pasa el de la pantalla, sea cual sea el ancho real del contenido.
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, left: 16 });
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
