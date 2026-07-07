"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface ContactarPublicacionButtonProps {
  listingId: string;
  nombre: string;
  whatsappPublico: boolean;
}

export default function ContactarPublicacionButton({ listingId, nombre, whatsappPublico }: ContactarPublicacionButtonProps) {
  const [contacting, setContacting] = useState(false);
  const [error, setError] = useState(false);

  if (!whatsappPublico) {
    return (
      <div className="rounded-lg border border-piedra/60 bg-hueso-2 p-3.5 text-center text-[13px] text-tinta">
        Para cuidar la seguridad de la comunidad, necesitás iniciar sesión para contactar por esta publicación.{" "}
        <Link href="/" className="font-semibold text-golfo">
          Abrir en Origen El Doradillo
        </Link>
      </div>
    );
  }

  async function handleContact() {
    setContacting(true);
    setError(false);
    const supabase = createClient();
    const { data: numero, error: rpcError } = await supabase.rpc("contactar_publicacion", { p_listing_id: listingId });
    setContacting(false);
    if (rpcError || !numero) {
      setError(true);
      return;
    }
    trackEvent("contact_whatsapp", { listing_id: listingId, source: "listing_page" });
    const mensaje = `Hola, vi tu publicación en Origen El Doradillo sobre ${nombre}. Quería consultar si sigue disponible.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
  }

  return (
    <>
      <button
        onClick={handleContact}
        disabled={contacting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-oliva py-3.5 text-[14.5px] font-semibold text-hueso disabled:opacity-60"
      >
        <i className="ti ti-brand-whatsapp text-lg" aria-hidden />
        {contacting ? "Un momento..." : "Contactar por WhatsApp"}
      </button>
      {error && <p className="mt-2 text-center text-[12px] text-red-700">No pudimos obtener el contacto. Probá de nuevo.</p>}
    </>
  );
}
