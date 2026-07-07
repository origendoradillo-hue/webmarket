"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ListingReportRow } from "@/lib/supabase/types";

type Motivo = ListingReportRow["motivo"];

interface ReportListingModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  user: User;
}

const MOTIVOS: { value: Motivo; label: string }[] = [
  { value: "informacion_falsa", label: "Información falsa o engañosa" },
  { value: "producto_no_disponible", label: "Producto no disponible" },
  { value: "precio_no_coincide", label: "Precio o condiciones no coinciden" },
  { value: "publicador_no_responde", label: "Publicador no responde" },
  { value: "sospecha_estafa", label: "Sospecha de estafa" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado" },
  { value: "categoria_incorrecta", label: "Categoría incorrecta" },
  { value: "publicacion_duplicada", label: "Publicación duplicada" },
  { value: "fotos_falsas", label: "Fotos falsas o robadas" },
  { value: "insultos_agravios", label: "Insultos o agravios" },
  { value: "otro", label: "Otro" },
];

export default function ReportListingModal({ open, onClose, listingId, user }: ReportListingModalProps) {
  const [motivo, setMotivo] = useState<Motivo>(MOTIVOS[0].value);
  const [justificacion, setJustificacion] = useState("");
  const [evidenciaUrl, setEvidenciaUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "info">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMotivo(MOTIVOS[0].value);
      setJustificacion("");
      setEvidenciaUrl("");
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (justificacion.trim() === "") {
      setStatus("error");
      setMessage("Contanos el motivo con un poco más de detalle.");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      motivo,
      justificacion: justificacion.trim(),
      evidencia_url: evidenciaUrl.trim() || null,
    });
    if (error) {
      setStatus("error");
      setMessage(error.code === "23505" ? "Ya denunciaste esta publicación antes." : error.message);
      return;
    }
    setStatus("info");
    setMessage("Recibimos tu denuncia. El equipo la va a revisar.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Denunciar publicación</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {status === "info" ? (
            <>
              <p className="mb-4 text-[13px] text-oliva">{message}</p>
              <button onClick={onClose} className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso">
                Listo
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Motivo</label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as Motivo)}
                className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
              >
                {MOTIVOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {motivo === "insultos_agravios" && (
                <p className="mb-3 rounded-lg bg-[#FBF3E4] px-3 py-2.5 text-[11.5px] text-tinta">
                  Si se confirma un cruce de insultos o agravios, el equipo puede suspender la cuenta de <strong>ambas</strong> partes
                  involucradas, no solo la denunciada.
                </p>
              )}

              <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Contanos qué pasó</label>
              <textarea
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Describí el problema con el mayor detalle posible"
                className="mb-3 min-h-[80px] w-full resize-y rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
              />

              <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Evidencia (opcional)</label>
              <input
                type="text"
                value={evidenciaUrl}
                onChange={(e) => setEvidenciaUrl(e.target.value)}
                placeholder="Link a una captura o foto"
                className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
              />

              {status === "error" && <p className="mb-3 text-[12px] text-red-700">{message}</p>}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
              >
                {status === "sending" ? "Enviando..." : "Enviar denuncia"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
