"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  label?: string;
}

export default function ShareButton({ url, title, text, className, label }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // el usuario canceló el share nativo — no hacemos nada
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={handleShare} aria-label="Compartir" className={`relative ${className || ""}`}>
      <i className={`ti ti-share-3 ${label ? "text-base" : "text-lg"} text-tinta`} aria-hidden />
      {label && <span className="ml-1.5">{label}</span>}
      {copied && (
        <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-tinta px-2 py-1 text-[11px] font-normal text-hueso">
          Enlace copiado
        </span>
      )}
    </button>
  );
}
