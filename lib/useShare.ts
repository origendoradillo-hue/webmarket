"use client";

import { useState } from "react";

interface ShareParams {
  url: string;
  title: string;
  text?: string;
  imageUrl?: string;
}

// Compartir solo {title,text,url} hace que WhatsApp tenga que bajar el
// og:image por su cuenta DESPUÉS de que el link cae en el chat — si se
// toca "Enviar" antes de que termine, se manda sin foto. Si el navegador
// soporta compartir archivos (navigator.canShare({files})), mandamos la
// imagen como adjunto real: no hay ningún crawler de por medio, así que
// no hay carrera posible. Si no hay imagen o el navegador no lo soporta,
// cae al camino de siempre (share nativo con url, o copiar al portapapeles).
export function useShare({ url, title, text, imageUrl }: ShareParams) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator === "undefined") return;

    if (imageUrl && navigator.canShare) {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "imagen.jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text: text ? `${text}\n${url}` : url, files: [file] });
          return;
        }
      } catch {
        // Si falla la descarga/armado del archivo, seguimos al camino normal.
      }
    }

    if (navigator.share) {
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

  return { share, copied };
}
