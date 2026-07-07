"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/supabase/types";

const REPORT_MOTIVO_LABELS: Record<string, string> = {
  informacion_falsa: "Información falsa o engañosa",
  producto_no_disponible: "Producto no disponible",
  precio_no_coincide: "Precio o condiciones no coinciden",
  publicador_no_responde: "Publicador no responde",
  sospecha_estafa: "Sospecha de estafa",
  contenido_inapropiado: "Contenido inapropiado",
  categoria_incorrecta: "Categoría incorrecta",
  publicacion_duplicada: "Publicación duplicada",
  fotos_falsas: "Fotos falsas o robadas",
  insultos_agravios: "Insultos o agravios",
  otro: "Otro",
};

interface ListingReport {
  id: string;
  listing_id: string;
  motivo: string;
  justificacion: string;
  estado: string;
  respuesta_denunciado: string | null;
}

interface MyListingsModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  activa: "Activa",
  observada: "Observada",
  rechazada: "Rechazada",
  pausada: "Pausada",
  vencida: "Vencida",
  eliminada: "Eliminada",
};

const STATUS_COLOR: Record<string, string> = {
  borrador: "bg-piedra/70 text-hueso",
  en_revision: "bg-dorado text-hueso",
  activa: "bg-oliva text-hueso",
  observada: "bg-dorado text-hueso",
  rechazada: "bg-red-700 text-hueso",
  pausada: "bg-piedra text-hueso",
  vencida: "bg-nogal text-hueso",
  eliminada: "bg-tinta text-hueso",
};

interface EditForm {
  nombre: string;
  descripcion: string;
  precio: string;
  precioConsultar: boolean;
  zona: string;
  cuadrante: string;
  direccion: string;
  tags: string;
  whatsappPublico: boolean;
}

export default function MyListingsModal({ open, onClose, user }: MyListingsModalProps) {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [ratingInfo, setRatingInfo] = useState<{ promedio: number | null; count: number }>({ promedio: null, count: 0 });
  const [reportsByListing, setReportsByListing] = useState<Record<string, ListingReport[]>>({});
  const [respuestaDraft, setRespuestaDraft] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("publisher_id", user.id)
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);

    const ids = (data || []).map((l) => l.id);
    if (ids.length === 0) {
      setReportsByListing({});
      return;
    }
    const { data: reports } = await supabase
      .from("listing_reports")
      .select("id, listing_id, motivo, justificacion, estado, respuesta_denunciado")
      .in("listing_id", ids)
      .neq("estado", "rechazada");
    const grouped: Record<string, ListingReport[]> = {};
    for (const r of reports || []) {
      (grouped[r.listing_id] ||= []).push(r);
    }
    setReportsByListing(grouped);
  }, [user.id]);

  async function responderDenuncia(reportId: string) {
    const respuesta = (respuestaDraft[reportId] || "").trim();
    if (!respuesta) return;
    setRespondingId(reportId);
    const supabase = createClient();
    const { error } = await supabase.rpc("responder_denuncia", { p_report_id: reportId, p_respuesta: respuesta });
    setRespondingId(null);
    if (error) {
      alert(error.message);
      return;
    }
    await loadListings();
  }

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setExpandedId(null);
    loadListings();
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("rating_promedio, resenas_count")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setRatingInfo({ promedio: data?.rating_promedio ?? null, count: data?.resenas_count ?? 0 }));
  }, [open, loadListings, user.id]);

  if (!open) return null;

  async function toggleExpand(l: ListingRow) {
    if (expandedId === l.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(l.id);
    setNewPhotos([]);
    setEditForm({
      nombre: l.nombre,
      descripcion: l.descripcion,
      precio: l.precio != null ? String(l.precio) : "",
      precioConsultar: l.precio_a_consultar,
      zona: l.zona,
      cuadrante: l.cuadrante || "",
      direccion: l.direccion || "",
      tags: (l.tags || []).join(", "),
      whatsappPublico: l.whatsapp_publico,
    });
    const supabase = createClient();
    const { data } = await supabase.from("listing_images").select("id, url").eq("listing_id", l.id).order("orden");
    setImages(data || []);
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPhotos((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function removeExistingImage(imageId: string) {
    const supabase = createClient();
    await supabase.from("listing_images").delete().eq("id", imageId);
    setImages((prev) => prev.filter((im) => im.id !== imageId));
  }

  async function handleSave(l: ListingRow) {
    if (!editForm) return;
    setSaving(true);
    const supabase = createClient();

    const uploadedUrls: string[] = [];
    for (const dataUrl of newPhotos) {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${user.id}/${Date.now()}-${uploadedUrls.length}.jpg`;
      const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, blob, {
        contentType: blob.type || "image/jpeg",
      });
      if (uploadError) {
        alert(uploadError.message);
        setSaving(false);
        return;
      }
      uploadedUrls.push(supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl);
    }

    let fotoUrlParam: string | undefined;
    let extraToInsert = uploadedUrls;
    if (!l.foto_url && uploadedUrls.length > 0) {
      fotoUrlParam = uploadedUrls[0];
      extraToInsert = uploadedUrls.slice(1);
    }

    const { error } = await supabase.rpc("mi_update_listing", {
      p_listing_id: l.id,
      p_nombre: editForm.nombre,
      p_descripcion: editForm.descripcion,
      p_precio: editForm.precio.trim() === "" ? null : Number(editForm.precio),
      p_precio_a_consultar: editForm.precioConsultar,
      p_zona: editForm.zona,
      p_cuadrante: editForm.cuadrante || null,
      p_direccion: editForm.direccion || null,
      p_tags: editForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      p_whatsapp_publico: editForm.whatsappPublico,
      ...(fotoUrlParam ? { p_foto_url: fotoUrlParam } : {}),
    });
    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    if (extraToInsert.length > 0) {
      await supabase.from("listing_images").insert(extraToInsert.map((url, i) => ({ listing_id: l.id, url, orden: images.length + i })));
    }

    setSaving(false);
    setExpandedId(null);
    await loadListings();
  }

  async function changeStatus(l: ListingRow, status: "activa" | "pausada" | "eliminada") {
    if (status === "eliminada" && !confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setStatusBusyId(l.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("mi_set_listing_status", { p_listing_id: l.id, p_status: status });
    setStatusBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    await loadListings();
  }

  async function renovar(l: ListingRow) {
    setStatusBusyId(l.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("renovar_publicacion", { p_listing_id: l.id });
    setStatusBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    await loadListings();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Mis publicaciones</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        <div className="flex items-start gap-2 bg-[#FBF3E4] px-4 py-2.5 text-[12px] leading-relaxed text-tinta">
          <i className="ti ti-star mt-0.5 flex-shrink-0 text-dorado" aria-hidden />
          <span>
            {ratingInfo.count > 0 ? (
              <>
                Tu calificación: <strong>{ratingInfo.promedio?.toFixed(1)}</strong> ({ratingInfo.count} reseña
                {ratingInfo.count === 1 ? "" : "s"}).{" "}
              </>
            ) : null}
            Invitá a quienes te contactan a dejar una reseña real — ayuda a que toda la comunidad confíe más en Origen El
            Doradillo.
          </span>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">Cargando...</p>
          ) : listings.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">Todavía no publicaste nada.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {listings.map((l) => (
                <div key={l.id} className="overflow-hidden rounded-lg border border-piedra/50">
                  <button type="button" onClick={() => toggleExpand(l)} className="flex w-full items-center gap-3 p-3 text-left">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-hueso-2">
                      {l.foto_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.foto_url} alt={l.nombre} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-tinta">{l.nombre}</p>
                      <p className="text-[11.5px] text-tinta-suave">{new Date(l.created_at).toLocaleDateString("es-AR")}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-medium ${STATUS_COLOR[l.status] ?? "bg-piedra text-hueso"}`}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                    <i className={`ti ${expandedId === l.id ? "ti-chevron-up" : "ti-chevron-down"} text-tinta-suave`} aria-hidden />
                  </button>

                  {expandedId === l.id && editForm && (
                    <div className="border-t border-piedra/40 bg-hueso-2 p-3.5">
                      {l.expires_at && ["activa", "pausada", "vencida"].includes(l.status) && (
                        <p className={`mb-2.5 text-[12px] ${new Date(l.expires_at) < new Date() ? "font-medium text-red-700" : "text-tinta-suave"}`}>
                          {new Date(l.expires_at) < new Date() ? "Venció el " : "Vence el "}
                          {new Date(l.expires_at).toLocaleDateString("es-AR")}
                        </p>
                      )}
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {l.status === "activa" && (
                          <ActionButton onClick={() => changeStatus(l, "pausada")} busy={statusBusyId === l.id} icon="ti-player-pause">
                            Pausar
                          </ActionButton>
                        )}
                        {(l.status === "pausada" || l.status === "vencida") && (
                          <ActionButton onClick={() => changeStatus(l, "activa")} busy={statusBusyId === l.id} icon="ti-player-play">
                            Reactivar
                          </ActionButton>
                        )}
                        {["activa", "pausada", "vencida"].includes(l.status) && (
                          <ActionButton onClick={() => renovar(l)} busy={statusBusyId === l.id} icon="ti-refresh">
                            Renovar
                          </ActionButton>
                        )}
                        {l.status !== "eliminada" && (
                          <ActionButton onClick={() => changeStatus(l, "eliminada")} busy={statusBusyId === l.id} icon="ti-trash">
                            Eliminar
                          </ActionButton>
                        )}
                      </div>

                      {(reportsByListing[l.id] || []).map((r) => (
                        <div key={r.id} className="mb-3 rounded-lg border border-dorado/60 bg-[#FBF3E4] p-3">
                          <p className="mb-1 text-[12.5px] font-semibold text-tinta">
                            Denuncia: {REPORT_MOTIVO_LABELS[r.motivo] ?? r.motivo}
                          </p>
                          <p className="mb-2 text-[12px] text-tinta">{r.justificacion}</p>
                          {r.respuesta_denunciado ? (
                            <p className="text-[12px] text-tinta-suave">
                              <span className="font-medium text-tinta">Tu respuesta:</span> {r.respuesta_denunciado}
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={respuestaDraft[r.id] || ""}
                                onChange={(e) => setRespuestaDraft({ ...respuestaDraft, [r.id]: e.target.value })}
                                placeholder="Tu versión de lo que pasó"
                                className="w-full rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[12.5px] text-tinta"
                              />
                              <button
                                onClick={() => responderDenuncia(r.id)}
                                disabled={respondingId === r.id}
                                className="flex-shrink-0 rounded-lg bg-oliva px-3 py-2 text-[12px] font-semibold text-hueso disabled:opacity-60"
                              >
                                Responder
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      <MiniField label="Nombre">
                        <input
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                          className="w-full rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta"
                        />
                      </MiniField>
                      <MiniField label="Descripción">
                        <textarea
                          value={editForm.descripcion}
                          onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                          className="min-h-[56px] w-full resize-y rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta"
                        />
                      </MiniField>
                      <div className="mb-2.5 flex items-center gap-2.5">
                        <input
                          type="number"
                          placeholder="Precio"
                          disabled={editForm.precioConsultar}
                          value={editForm.precio}
                          onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                          className="w-full rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta disabled:bg-hueso-2"
                        />
                        <label className="flex flex-shrink-0 items-center gap-1.5 text-[11.5px] text-tinta">
                          <input
                            type="checkbox"
                            checked={editForm.precioConsultar}
                            onChange={(e) => setEditForm({ ...editForm, precioConsultar: e.target.checked })}
                          />
                          A consultar
                        </label>
                      </div>
                      <div className="mb-2.5 grid grid-cols-2 gap-2">
                        <input
                          placeholder="Barrio"
                          value={editForm.zona}
                          onChange={(e) => setEditForm({ ...editForm, zona: e.target.value })}
                          className="rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta"
                        />
                        <input
                          placeholder="Dirección o link de Maps (opcional)"
                          value={editForm.direccion}
                          onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                          className="rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta"
                        />
                      </div>
                      <MiniField label="Palabras clave (separadas por coma)">
                        <input
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          className="w-full rounded-lg border border-piedra/70 bg-white px-2.5 py-2 text-[13px] text-tinta"
                        />
                      </MiniField>

                      <label className="mb-2.5 flex items-start gap-2 text-[12px] text-tinta">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={editForm.whatsappPublico}
                          onChange={(e) => setEditForm({ ...editForm, whatsappPublico: e.target.checked })}
                        />
                        Mostrar mi WhatsApp sin pedir inicio de sesión
                      </label>

                      <MiniField label="Fotos">
                        <div className="grid grid-cols-4 gap-2">
                          {l.foto_url && (
                            <div className="relative h-16 overflow-hidden rounded-md border border-piedra/70">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={l.foto_url} alt="Portada" className="h-full w-full object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[9px] text-white">Portada</span>
                            </div>
                          )}
                          {images.map((im) => (
                            <div key={im.id} className="relative h-16 overflow-hidden rounded-md border border-piedra/70">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={im.url} alt="Foto" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(im.id)}
                                aria-label="Quitar foto"
                                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                              >
                                <i className="ti ti-x text-[9px]" aria-hidden />
                              </button>
                            </div>
                          ))}
                          {newPhotos.map((v, i) => (
                            <div key={`new-${i}`} className="relative h-16 overflow-hidden rounded-md border border-dorado">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={v} alt="Nueva foto" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          <label className="flex h-16 cursor-pointer items-center justify-center rounded-md border-[1.5px] border-dashed border-piedra/70 text-oliva">
                            <i className="ti ti-plus text-lg" aria-hidden />
                            <input type="file" accept="image/*" multiple onChange={handleNewPhotos} className="hidden" />
                          </label>
                        </div>
                      </MiniField>

                      <button
                        type="button"
                        onClick={() => handleSave(l)}
                        disabled={saving}
                        className="mt-1 w-full rounded-lg bg-oliva py-2.5 text-[13px] font-semibold text-hueso disabled:bg-piedra"
                      >
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg border border-piedra/70 bg-white px-3 py-1.5 text-[12px] font-medium text-tinta disabled:opacity-60"
    >
      <i className={`ti ${icon} text-sm`} aria-hidden />
      {children}
    </button>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] font-medium text-tinta">{label}</label>
      {children}
    </div>
  );
}
