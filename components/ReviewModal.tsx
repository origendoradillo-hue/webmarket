"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingNombre?: string;
  publisherName?: string;
  user: User;
  onSubmitted?: () => void;
}

export default function ReviewModal({ open, onClose, listingId, listingNombre, publisherName, user, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "info">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setRating(0);
      setHoverRating(0);
      setComentario("");
      setStatus("idle");
      setMessage("");
    }
  }, [open, listingId]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setStatus("error");
      setMessage("Elegí una calificación de 1 a 5 estrellas.");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_review", {
      p_listing_id: listingId,
      p_rating: rating,
      p_comentario: comentario.trim() || null,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message || "No pudimos guardar tu reseña. Probá de nuevo.");
      return;
    }
    setStatus("info");
    setMessage("¡Gracias! Tu reseña ayuda a que toda la comunidad confíe más en Origen El Doradillo.");
    onSubmitted?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">
            {publisherName ? `Reseñar a ${publisherName}` : "Dejar una reseña"}
          </span>
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
              <p className="mb-3 text-[12.5px] text-tinta-suave">
                {publisherName ? (
                  <>
                    Estás calificando a <strong className="text-tinta">{publisherName}</strong>, no la publicación
                    {listingNombre ? (
                      <>
                        {" "}
                        — a raíz de tu contacto por <em className="not-italic">{listingNombre}</em>
                      </>
                    ) : null}
                    . Las reseñas son públicas y con tu nombre.
                  </>
                ) : (
                  "Las reseñas son públicas y con tu nombre — ayudan a la comunidad a confiar en quién ofrece qué."
                )}
              </p>
              <div className="mb-4 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${n} estrellas`}
                    className="p-1"
                  >
                    <i
                      className={`ti ti-star text-3xl ${n <= (hoverRating || rating) ? "text-dorado" : "text-piedra/50"}`}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>

              <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Comentario (opcional)</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Contanos cómo fue tu experiencia"
                className="mb-3 min-h-[80px] w-full resize-y rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
              />

              {status === "error" && <p className="mb-3 text-[12px] text-red-700">{message}</p>}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
              >
                {status === "sending" ? "Enviando..." : "Enviar reseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
