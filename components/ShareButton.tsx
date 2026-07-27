"use client";

import { useShare } from "@/lib/useShare";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  imageUrl?: string;
  className?: string;
  label?: string;
}

export default function ShareButton({ url, title, text, imageUrl, className, label }: ShareButtonProps) {
  const { share, copied } = useShare({ url, title, text, imageUrl });

  return (
    <button type="button" onClick={share} aria-label="Compartir" className={`relative ${className || ""}`}>
      {/* Sin color propio — hereda el del botón (className), así funciona
          tanto en botones oscuros sobre fondo claro como blancos sobre
          fondo de color (ej. el de WhatsApp). */}
      <i className={`ti ti-share-3 ${label ? "text-base" : "text-lg"}`} aria-hidden />
      {label && <span className="ml-1.5">{label}</span>}
      {copied && (
        <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-tinta px-2 py-1 text-[11px] font-normal text-hueso">
          Enlace copiado
        </span>
      )}
    </button>
  );
}
