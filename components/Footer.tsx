"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Footer() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("crear_solicitud_soporte", {
      p_nombre: nombre,
      p_contacto: contacto,
      p_mensaje: mensaje,
    });
    setSending(false);
    if (rpcError) {
      setError("No pudimos enviar tu mensaje. Probá de nuevo en un momento.");
      return;
    }
    setSent(true);
  }

  return (
    <footer className="mt-6 bg-oliva-dd text-hueso">
      <div className="mx-auto max-w-[1240px] px-5 pb-6 pt-10 sm:px-8 sm:pt-11">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <svg width="26" height="19" viewBox="0 0 60 44" aria-hidden>
                <circle cx="44" cy="9" r="6" fill="none" stroke="#B8863E" strokeWidth="1.5" />
                <circle cx="44" cy="9" r="2.3" fill="#B8863E" />
                <path d="M2 20 C14 14,26 22,38 16 C46 12,52 16,58 14" stroke="#F2EDE4" strokeWidth="1.6" fill="none" />
                <path d="M2 27 C14 21,26 29,38 23 C46 19,52 23,58 21" stroke="#F2EDE4" strokeWidth="1.6" fill="none" />
                <path d="M2 34 L58 30" stroke="#B8863E" strokeWidth="2" fill="none" />
              </svg>
              <div className="leading-tight">
                <span className="block font-slab text-base font-semibold text-hueso">Origen</span>
                <span className="block text-[9px] uppercase tracking-[0.1em] text-arena">El Doradillo</span>
              </div>
            </div>
            <p className="mb-3 max-w-[240px] text-[12.5px] leading-relaxed text-hueso/75">
              Productos, servicios y experiencias con origen en la zona rural norte de Madryn.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/sobre-origen" className="text-xs text-hueso/70">
                Sobre Origen
              </Link>
              <Link href="/como-funciona" className="text-xs text-hueso/70">
                Cómo funciona
              </Link>
              <Link href="/publicar-en-origen" className="text-xs text-hueso/70">
                Publicar en Origen
              </Link>
              <Link href="/seguridad" className="text-xs text-hueso/70">
                Seguridad de la comunidad
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-3 font-slab text-[13px] font-semibold text-dorado">Contacto</p>
            <a className="mb-2.5 flex items-center gap-2 text-[13px] text-hueso/85" href="https://wa.me/5492804874717" target="_blank" rel="noreferrer">
              <i className="ti ti-brand-whatsapp text-arena" aria-hidden /> WhatsApp
            </a>
            <a className="mb-2.5 flex items-center gap-2 text-[13px] text-hueso/85" href="mailto:origendoradillo@gmail.com">
              <i className="ti ti-mail text-arena" aria-hidden /> origendoradillo@gmail.com
            </a>
            <a className="mb-2.5 flex items-center gap-2 text-[13px] text-hueso/85" href="https://instagram.com/origen.eldoradillo" target="_blank" rel="noreferrer">
              <i className="ti ti-brand-instagram text-arena" aria-hidden /> @origen.eldoradillo
            </a>
          </div>

          <div>
            <p className="mb-3 font-slab text-[13px] font-semibold text-dorado">Escribinos</p>
            {sent ? (
              <p className="text-[12.5px] text-hueso/85">¡Gracias! Te vamos a responder pronto.</p>
            ) : (
              <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="rounded-md border border-white/25 bg-white/10 px-2.5 py-2 text-[12.5px] text-hueso placeholder:text-hueso/50"
                />
                <input
                  required
                  type="tel"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Tu WhatsApp"
                  className="rounded-md border border-white/25 bg-white/10 px-2.5 py-2 text-[12.5px] text-hueso placeholder:text-hueso/50"
                />
                <p className="-mt-1 text-[11px] text-hueso/60">Dejá tu WhatsApp para que te podamos responder más rápido.</p>
                <textarea
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="¿Tenés dudas o querés sumar tu emprendimiento?"
                  className="min-h-[56px] resize-y rounded-md border border-white/25 bg-white/10 px-2.5 py-2 text-[12.5px] text-hueso placeholder:text-hueso/50"
                />
                {error && <p className="text-[11.5px] text-red-300">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-fit rounded-md bg-dorado px-4 py-2 text-[12.5px] font-semibold text-oliva-dd disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            )}
          </div>

          <div>
            <p className="mb-3 font-slab text-[13px] font-semibold text-dorado">Legal</p>
            <div className="flex flex-col gap-2">
              <Link href="/terminos" className="text-xs text-hueso/70">
                Términos y condiciones
              </Link>
              <Link href="/privacidad" className="text-xs text-hueso/70">
                Política de privacidad
              </Link>
              <Link href="/como-funciona" className="text-xs text-hueso/70">
                Cómo funciona el sello
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/15 pt-4">
          <span className="text-[11.5px] text-hueso/55">© 2026 Origen El Doradillo. Todos los derechos reservados.</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dorado bg-dorado/15 px-3 py-1 text-[11px] font-medium text-dorado">
            <i className="ti ti-tools" aria-hidden /> Versión en desarrollo
          </span>
        </div>
      </div>
    </footer>
  );
}
