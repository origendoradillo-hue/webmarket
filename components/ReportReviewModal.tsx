"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ReviewReportRow } from "@/lib/supabase/types";

type Motivo = ReviewReportRow["motivo"];

interface ReportReviewModalProps {
  open: boolean;
  onClose: () => void;
  reviewId: string;
  user: User;
}

const MOTIVOS: { value: Motivo; label: string }[] = [
  { value: "informacion_falsa", label: "Información falsa" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado" },
  { value: "sospecha_falsa", label: "Sospecho que es una reseña falsa" },
  { value: "otro", label: "Otro" },
];

export default function ReportReviewModal({ open, onClose, reviewId, user }: ReportReviewModalProps) {
  const [motivo, setMotivo] = useState<Motivo>(MOTIVOS[0].value);
  const [justificacion, setJustificacion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "info">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMotivo(MOTIVOS[0].value);
      setJustificacion("");
      setStatus("idle");
      setMessage("");
    }
  }, [open, reviewId]);

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
    const { error } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: user.id,
      motivo,
      justificacion: justificacion.trim(),
    });
    if (error) {
      setStatus("error");
      setMessage(error.code === "23505" ? "Ya reportaste esta reseña antes." : error.message);
      return;
    }
    setStatus("info");
    setMessage("Recibimos tu reporte. El equipo lo va a revisar.");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Reportar reseña</span>
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

              <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Contanos qué pasó</label>
              <textarea
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Describí el problema con el mayor detalle posible"
                className="mb-3 min-h-[80px] w-full resize-y rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
              />

              {status === "error" && <p className="mb-3 text-[12px] text-red-700">{message}</p>}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
              >
                {status === "sending" ? "Enviando..." : "Enviar reporte"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
