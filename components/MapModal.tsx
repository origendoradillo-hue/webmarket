"use client";

import Image from "next/image";

interface MapModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MapModal({ open, onClose }: MapModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Mapa del barrio</span>
          <button onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>
        <div className="p-4">
          <Image
            src="/brand/mapa-zonas.png"
            alt="Mapa de zonas del barrio"
            width={1000}
            height={700}
            className="block w-full rounded-lg"
          />
          <p className="mt-3 text-xs leading-relaxed text-piedra">
            Zona 1, 2 y 3 según el loteo original del barrio. Cada publicación puede sumar un cuadrante
            (norte, sur, este, oeste) dentro de su zona, y opcionalmente un enlace a Google Maps si el
            vecino quiere precisar la ubicación exacta.
          </p>
        </div>
      </div>
    </div>
  );
}
