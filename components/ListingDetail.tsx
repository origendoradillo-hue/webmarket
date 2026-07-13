"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { fallbackColorFor } from "@/lib/data";
import { useCategories } from "@/lib/useCategories";
import { Listing } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import ReportReviewModal from "./ReportReviewModal";
import ShareButton from "./ShareButton";
import SeBuscaPlaceholder from "./SeBuscaPlaceholder";
import ListingQuestions from "./ListingQuestions";

interface ReviewWithReviewer {
  id: string;
  reviewer_id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface ListingDetailProps {
  listing: Listing | null;
  onClose: () => void;
  isLoggedIn: boolean;
  user: User | null;
  onRequireAuth: () => void;
  onReport: () => void;
  onReview: () => void;
}

export default function ListingDetail({ listing: l, onClose, isLoggedIn, user, onRequireAuth, onReport, onReview }: ListingDetailProps) {
  const { categories } = useCategories();
  const [contacting, setContacting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComentario, setEditComentario] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (!l) return;
    const listingId = String(l.id);
    async function registrarVista() {
      const supabase = createClient();
      await supabase.rpc("registrar_vista", { p_listing_id: listingId });
    }
    registrarVista();
  }, [l?.id]);

  useEffect(() => {
    setImgIndex(0);
    setLightboxOpen(false);
    if (!l) {
      setImages([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("listing_images")
      .select("url")
      .eq("listing_id", String(l.id))
      .order("orden")
      .then(({ data }) => {
        const extra = (data || []).map((r) => r.url);
        setImages(l.foto ? [l.foto, ...extra] : extra);
      });
  }, [l?.id, l?.foto]);

  async function loadReviews(publisherId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, reviewer_id, rating, comentario, created_at, profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("target_user_id", publisherId)
      .eq("estado", "publicada")
      .order("created_at", { ascending: false })
      .limit(10);
    setReviews((data as unknown as ReviewWithReviewer[]) || []);
  }

  useEffect(() => {
    if (!l || !l.publisherId) {
      setReviews([]);
      return;
    }
    loadReviews(l.publisherId);
  }, [l?.publisherId]);

  function startEditReview(r: ReviewWithReviewer) {
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditComentario(r.comentario || "");
  }

  function cancelEditReview() {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComentario("");
  }

  async function saveEditReview(reviewId: string) {
    if (editRating === 0 || editComentario.trim() === "") return;
    setSavingReview(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("editar_review", {
      p_review_id: reviewId,
      p_rating: editRating,
      p_comentario: editComentario.trim(),
    });
    setSavingReview(false);
    if (error) {
      alert(error.message);
      return;
    }
    cancelEditReview();
    if (l?.publisherId) await loadReviews(l.publisherId);
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("¿Eliminar tu reseña? No se puede deshacer.")) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("eliminar_review", { p_review_id: reviewId });
    if (error) {
      alert(error.message);
      return;
    }
    if (l?.publisherId) await loadReviews(l.publisherId);
  }

  if (!l) return null;
  const listing = l;

  const fallbackColor = fallbackColorFor(l.id);
  const isVecino = l.tipoPublicador === "vecino";
  const isNegocio = l.tipoPublicador === "negocio";
  const isDemanda = l.intencion === "busco";
  const mapsUrl = l.direccion
    ? /^https?:\/\//i.test(l.direccion.trim())
      ? l.direccion.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.direccion + " Puerto Madryn")}`
    : null;

  const requiereLogin = !listing.whatsappPublico;

  async function handleContact() {
    if (requiereLogin && !isLoggedIn) {
      onRequireAuth();
      return;
    }

    setContacting(true);
    const supabase = createClient();
    const { data: numero, error } = await supabase.rpc("contactar_publicacion", {
      p_listing_id: String(listing.id),
    });
    setContacting(false);

    if (error || !numero) {
      alert(error?.message || "No pudimos obtener el contacto. Probá de nuevo en un momento.");
      return;
    }

    trackEvent("contact_whatsapp", { listing_id: String(listing.id), source: "modal" });
    const mensaje = `Hola, vi tu publicación en Origen El Doradillo sobre ${listing.nombre}. Quería consultar si sigue disponible.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Publicación</span>
          <div className="flex items-center gap-4">
            <ShareButton
              url={listing.shortCode ? `${SITE_URL}/p/${listing.shortCode}` : `${SITE_URL}/publicacion/${listing.id}`}
              title={listing.nombre}
              text={listing.descripcion.slice(0, 120)}
            />
            <button onClick={onClose} aria-label="Cerrar">
              <i className="ti ti-x text-lg text-tinta" aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="relative aspect-[4/5] max-h-[70vh]"
          style={{
            backgroundColor: isDemanda ? undefined : images.length > 0 ? undefined : isVecino ? "#DCD7C9" : fallbackColor,
          }}
        >
          {isDemanda ? (
            <SeBuscaPlaceholder />
          ) : images.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Agrandar foto"
                className="absolute inset-0 h-full w-full"
              >
                <Image src={images[imgIndex]} alt={l.nombre} fill className="object-cover" sizes="480px" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"
                  >
                    <i className="ti ti-chevron-left text-lg" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"
                  >
                    <i className="ti ti-chevron-right text-lg" aria-hidden />
                  </button>
                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <i
              className={`ti ${isVecino ? "ti-photo" : l.icono} absolute inset-0 m-auto flex h-14 w-14 items-center justify-center text-6xl ${
                isVecino ? "text-nogal/50" : "text-hueso"
              }`}
              aria-hidden
            />
          )}
        </div>

        <div className="px-5 pb-6 pt-4">
          {isDemanda && (
            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-golfo px-3 py-1 text-xs font-medium text-hueso">
              <i className="ti ti-search text-sm" aria-hidden /> Busca esto (no es una oferta)
            </div>
          )}
          {l.sello && (
            <Image src="/brand/sello-claro.png" alt="Selección Origen El Doradillo" width={160} height={44} className="mb-3.5 h-9 w-auto" />
          )}

          <h2 className="mb-1 font-slab text-xl font-semibold text-tinta sm:text-[22px]">{l.nombre}</h2>
          {l.subtitulo && <p className="mb-1 text-[14px] text-tinta-suave">{l.subtitulo}</p>}
          <p className="mb-1 text-[13px] text-tinta-suave">
            {l.categoria && categories[l.categoria] ? `${categories[l.categoria].label}${l.subcategoria ? ` · ${l.subcategoria}` : ""}` : "Otro"}
          </p>
          {(l.precio || l.precioConsultar || l.precioRegalo) && (
            <p className="mb-1 font-slab text-lg font-semibold text-tinta">
              {l.precioRegalo ? "Se regala" : l.precioConsultar ? "Precio a consultar" : `$${l.precio!.toLocaleString("es-AR")}`}
            </p>
          )}
          <p className="mb-3 flex items-center gap-1 text-[13.5px] font-medium text-tinta">
            <i className="ti ti-map-pin text-xs" aria-hidden />
            {l.barrio || "El Doradillo"} · {l.zona}
            {l.cuadrante ? ` ${l.cuadrante}` : ""}
          </p>

          {l.direccion && (
            <p className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[13px] text-tinta">
              <i className="ti ti-map-pin" aria-hidden />
              {/^https?:\/\//i.test(l.direccion.trim()) ? l.zona : `${l.direccion} · ${l.zona}`}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-golfo">
                  Ver en Google Maps
                </a>
              )}
            </p>
          )}

          <p className="mb-3.5 text-[13px] font-semibold text-dorado">
            {l.rating > 0 ? (
              <>
                <i className="ti ti-star" aria-hidden /> {l.rating.toFixed(1)}{" "}
                <span className="font-normal text-piedra">· {l.reseñas} reseñas</span>
              </>
            ) : (
              <span className="font-normal text-piedra">Publicación nueva, todavía sin reseñas</span>
            )}
          </p>

          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {l.modalidad.map((m) => (
              <span key={m} className="rounded-full border border-piedra/70 px-2.5 py-1 text-xs font-medium text-tinta">
                {m}
              </span>
            ))}
          </div>

          {l.cantidad && (
            <p className="mb-3.5 text-[13px] text-tinta">
              <i className="ti ti-package text-sm" aria-hidden /> Disponible: {l.cantidad} unidades
            </p>
          )}

          <p className="mb-4 text-[15px] leading-relaxed text-tinta">{l.descripcion}</p>

          {l.tags && l.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {l.tags.map((t) => (
                <span key={t} className="rounded-full bg-hueso-2 px-2.5 py-1 text-[11.5px] text-golfo">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          )}

          {isNegocio && l.colorMarca && (
            <div className="h-[38px] rounded-t-lg" style={{ backgroundColor: l.colorMarca }} />
          )}
          <div
            className={`mb-4 flex items-center gap-2.5 border border-piedra/60 bg-white p-3.5 ${
              isNegocio ? "rounded-b-lg border-t-0" : "rounded-lg"
            }`}
          >
            <div
              className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-slab text-xs font-semibold text-hueso ${isNegocio ? "-mt-6" : ""}`}
              style={{ backgroundColor: isNegocio && l.colorMarca ? l.colorMarca : "#5C3D2E" }}
            >
              {isNegocio ? <i className={`ti ${l.icono}`} aria-hidden /> : isVecino ? <i className="ti ti-user" aria-hidden /> : l.iniciales}
            </div>
            <div>
              <div className="text-sm font-semibold text-tinta">{l.publisherName}</div>
              <div className="text-xs text-tinta-suave">
                {isVecino ? "Vecino verificado" : "Emprendimiento verificado"} · {l.zona}
              </div>
            </div>
            {(l.publisherInstagram || l.publisherFacebook) && (
              <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
                {l.publisherInstagram && (
                  <a href={l.publisherInstagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <i className="ti ti-brand-instagram text-lg text-tinta-suave" aria-hidden />
                  </a>
                )}
                {l.publisherFacebook && (
                  <a href={l.publisherFacebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <i className="ti ti-brand-facebook text-lg text-tinta-suave" aria-hidden />
                  </a>
                )}
              </div>
            )}
          </div>

          {user && user.id === listing.publisherId ? (
            <p className="rounded-lg bg-hueso-2 py-3 text-center text-[12.5px] text-tinta-suave">
              Esta es tu publicación — así la ve quien te contacte.
            </p>
          ) : (
            <>
              {requiereLogin && !isLoggedIn && (
                <p className="mb-2.5 text-[12px] text-tinta-suave">
                  Para cuidar la seguridad de la comunidad, necesitás iniciar sesión para ver este contacto.
                </p>
              )}
              <button
                onClick={handleContact}
                disabled={contacting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-oliva py-3.5 text-[14.5px] font-semibold text-hueso disabled:opacity-60"
              >
                <i className="ti ti-brand-whatsapp text-lg" aria-hidden />
                {contacting ? "Un momento..." : requiereLogin && !isLoggedIn ? "Ingresá para contactar" : "Contactar por WhatsApp"}
              </button>
            </>
          )}

          {user && user.id !== listing.publisherId && (
            <button
              onClick={onReview}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dorado py-2.5 text-[13px] font-semibold text-dorado"
            >
              <i className="ti ti-star text-sm" aria-hidden />
              Dejar una reseña
            </button>
          )}

          {reviews.length > 0 && (
            <div className="mt-5 border-t border-piedra/40 pt-4">
              <p className="mb-3 font-slab text-[13.5px] font-semibold text-tinta">Reseñas de este publicador</p>
              <div className="flex flex-col gap-3">
                {reviews.map((r) =>
                  editingReviewId === r.id ? (
                    <div key={r.id} className="rounded-lg bg-hueso-2 p-3">
                      <div className="mb-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setEditRating(n)} aria-label={`${n} estrellas`}>
                            <i className={`ti ti-star text-xl ${n <= editRating ? "text-dorado" : "text-piedra/50"}`} aria-hidden />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editComentario}
                        onChange={(e) => setEditComentario(e.target.value)}
                        className="mb-2 min-h-[60px] w-full resize-y rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[12.5px] text-tinta"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditReview(r.id)}
                          disabled={savingReview}
                          className="rounded-lg bg-oliva px-3 py-1.5 text-[12px] font-semibold text-hueso disabled:opacity-60"
                        >
                          Guardar
                        </button>
                        <button onClick={cancelEditReview} className="rounded-lg border border-piedra/70 px-3 py-1.5 text-[12px] text-tinta">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="rounded-lg bg-hueso-2 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12.5px] font-semibold text-tinta">{r.profiles?.full_name || "Vecino"}</span>
                        <span className="text-[11.5px] font-semibold text-dorado">
                          <i className="ti ti-star" aria-hidden /> {r.rating}
                        </span>
                      </div>
                      {r.comentario && <p className="mb-1.5 text-[12.5px] leading-relaxed text-tinta">{r.comentario}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-tinta-suave">{new Date(r.created_at).toLocaleDateString("es-AR")}</span>
                        {user && user.id === r.reviewer_id ? (
                          <div className="flex gap-2.5">
                            <button onClick={() => startEditReview(r)} className="text-[11px] text-tinta-suave underline">
                              Editar
                            </button>
                            <button onClick={() => deleteReview(r.id)} className="text-[11px] text-red-700 underline">
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          user && (
                            <button onClick={() => setReportReviewId(r.id)} className="text-[11px] text-tinta-suave underline">
                              Reportar
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <ListingQuestions listingId={String(l.id)} isLoggedIn={isLoggedIn} isOwner={!!user && user.id === l.publisherId} />

          <button
            onClick={() => (isLoggedIn ? onReport() : onRequireAuth())}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-[12px] text-tinta-suave"
          >
            <i className="ti ti-flag text-sm" aria-hidden />
            Denunciar publicación
          </button>
        </div>
      </div>

      {user && reportReviewId && (
        <ReportReviewModal open={!!reportReviewId} onClose={() => setReportReviewId(null)} reviewId={reportReviewId} user={user} />
      )}

      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <i className="ti ti-x text-xl" aria-hidden />
          </button>
          <div className="relative h-full w-full max-w-2xl">
            <Image src={images[imgIndex]} alt={l.nombre} fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      )}
    </div>
  );
}
