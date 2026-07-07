"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { TipoAnuncio } from "@/lib/types";

const TIPO_OPTIONS: { value: TipoAnuncio; label: string }[] = [
  { value: "evento", label: "Evento" },
  { value: "aviso_barrial", label: "Aviso barrial" },
  { value: "sponsor", label: "Sponsor" },
  { value: "promocion", label: "Promoción comercial" },
  { value: "comunicado", label: "Comunicado" },
  { value: "feria", label: "Feria" },
  { value: "novedad", label: "Novedad" },
];

interface AnuncioRequestFormProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

export default function AnuncioRequestForm({ open, onClose, user }: AnuncioRequestFormProps) {
  const [tipo, setTipo] = useState<TipoAnuncio>("evento");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setTipo("evento");
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setLugar("");
    setSent(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("solicitar_anuncio", {
      p_tipo: tipo,
      p_titulo: titulo,
      p_descripcion: descripcion,
      p_fecha_evento: fecha ? new Date(fecha).toISOString() : null,
      p_lugar: lugar || null,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Publicar un anuncio</span>
          <button onClick={handleClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-1 flex-col justify-center px-6 py-10 text-center">
            <i className="ti ti-circle-check mx-auto text-5xl text-oliva" aria-hidden />
            <h3 className="mt-4 font-slab text-lg font-semibold text-tinta">Solicitud enviada</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-suave">
              Quedó pendiente de revisión. El equipo se pone en contacto con vos (a {user.email}) para coordinarlo antes
              de publicarlo.
            </p>
            <button onClick={handleClose} className="mx-auto mt-6 rounded-lg bg-oliva px-6 py-2.5 text-[13.5px] font-semibold text-hueso">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-5 pb-4 pt-5 sm:px-6">
            <p className="mb-4 text-[13px] text-tinta-suave">
              Eventos, avisos barriales, sponsors, promociones, comunicados, ferias o novedades — esto no se publica
              solo, lo revisa el equipo antes de salir.
            </p>

            <Field label="Tipo">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAnuncio)}
                className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              >
                {TIPO_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título">
              <input
                required
                type="text"
                placeholder="Ej: Feria de productores de El Doradillo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                required
                placeholder="Contá de qué se trata"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="min-h-[64px] w-full resize-y rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              />
            </Field>

            {tipo === "evento" && (
              <>
                <Field label="Fecha (opcional)">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                  />
                </Field>
                <Field label="Lugar (opcional)">
                  <input
                    type="text"
                    placeholder="Ej: Club de campo, o un link de Google Maps"
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                  />
                </Field>
              </>
            )}

            {error && <p className="mb-3 text-[12px] text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-auto w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
            >
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">{label}</label>
      {children}
    </div>
  );
}
