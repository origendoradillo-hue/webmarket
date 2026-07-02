"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { CategoryKey } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { AnuncioRow, ListingRow, ModeracionLogRow, ProfileRow } from "@/lib/supabase/types";

type Tab = "publicaciones" | "anuncios" | "usuarios";

const LISTING_STATUS_LABELS: Record<string, string> = {
  activa: "Activa",
  pausada: "Pausada",
  vencida: "Vencida",
  eliminada: "Eliminada",
};
const LISTING_STATUS_OPTIONS = Object.keys(LISTING_STATUS_LABELS);

const ANUNCIO_STATUS_LABELS: Record<string, string> = {
  solicitado: "Solicitado",
  en_conversacion: "En conversación",
  aprobado: "Aprobado",
  programado: "Programado",
  publicado: "Publicado",
  pausado: "Pausado",
  vencido: "Vencido",
  rechazado: "Rechazado",
};
const ANUNCIO_STATUS_OPTIONS = Object.keys(ANUNCIO_STATUS_LABELS);

const ROLE_OPTIONS = ["publicador", "admin", "superadmin"];

type ListingWithPublisher = ListingRow & { profiles: { full_name: string | null; email: string | null; whatsapp_number: string | null } | null };
type AnuncioWithSolicitante = AnuncioRow & { profiles: { full_name: string | null; email: string | null; whatsapp_number: string | null } | null };

interface AdminClientProps {
  role: string;
}

export default function AdminClient({ role }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [listings, setListings] = useState<ListingWithPublisher[]>([]);
  const [anuncios, setAnuncios] = useState<AnuncioWithSolicitante[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [expandedAnuncio, setExpandedAnuncio] = useState<string | null>(null);
  const canManageUsers = role === "superadmin";

  const loadListings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select("*, profiles(full_name, email, whatsapp_number)")
      .order("created_at", { ascending: false });
    setListings((data as never as ListingWithPublisher[]) || []);
  }, []);

  const loadAnuncios = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("anuncios")
      .select("*, profiles(full_name, email, whatsapp_number)")
      .order("created_at", { ascending: false });
    setAnuncios((data as never as AnuncioWithSolicitante[]) || []);
  }, []);

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }, []);

  useEffect(() => {
    Promise.all([loadListings(), loadAnuncios(), loadUsers()]).finally(() => setLoading(false));
  }, [loadListings, loadAnuncios, loadUsers]);

  async function changeRole(userId: string, newRole: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: newRole });
    if (error) alert(error.message);
    else await loadUsers();
  }

  const pendingListings = listings.filter((l) => l.status === "activa" && Date.now() - new Date(l.created_at).getTime() < 1000 * 60 * 60 * 24);
  const solicitadosAnuncios = anuncios.filter((a) => a.status === "solicitado" || a.status === "en_conversacion");

  return (
    <div className="min-h-screen bg-hueso px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 font-slab text-2xl font-semibold text-tinta">Panel de administración</h1>
        <p className="mb-6 text-sm text-tinta-suave">Rol actual: {role}</p>

        <div className="mb-5 flex gap-2">
          <TabButton active={tab === "publicaciones"} onClick={() => setTab("publicaciones")}>
            Publicaciones
          </TabButton>
          <TabButton active={tab === "anuncios"} onClick={() => setTab("anuncios")}>
            Anuncios {solicitadosAnuncios.length > 0 && `(${solicitadosAnuncios.length})`}
          </TabButton>
          {canManageUsers && (
            <TabButton active={tab === "usuarios"} onClick={() => setTab("usuarios")}>
              Usuarios
            </TabButton>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-tinta-suave">Cargando...</p>
        ) : tab === "publicaciones" ? (
          <div className="flex flex-col gap-6">
            {pendingListings.length > 0 && (
              <div>
                <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-dorado">
                  Publicadas en las últimas 24h ({pendingListings.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {pendingListings.map((l) => (
                    <AdminListingRow
                      key={l.id}
                      listing={l}
                      expanded={expandedListing === l.id}
                      onToggle={() => setExpandedListing(expandedListing === l.id ? null : l.id)}
                      onSaved={loadListings}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">
                Todas las publicaciones ({listings.length})
              </h2>
              <div className="flex flex-col gap-2">
                {listings.map((l) => (
                  <AdminListingRow
                    key={l.id}
                    listing={l}
                    expanded={expandedListing === l.id}
                    onToggle={() => setExpandedListing(expandedListing === l.id ? null : l.id)}
                    onSaved={loadListings}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : tab === "anuncios" ? (
          <div className="flex flex-col gap-2">
            {anuncios.length === 0 && <p className="text-sm text-tinta-suave">Todavía no hay solicitudes de anuncios.</p>}
            {anuncios.map((a) => (
              <AdminAnuncioRow
                key={a.id}
                anuncio={a}
                expanded={expandedAnuncio === a.id}
                onToggle={() => setExpandedAnuncio(expandedAnuncio === a.id ? null : a.id)}
                onSaved={loadAnuncios}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-piedra/50 bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-tinta">{u.full_name || "(sin nombre)"}</p>
                  <p className="text-xs text-tinta-suave">{u.email}</p>
                  <p className="text-xs text-tinta-suave">{u.whatsapp_number}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${active ? "bg-oliva text-hueso" : "border border-piedra/70 text-tinta"}`}
    >
      {children}
    </button>
  );
}

function contactUrl(whatsapp: string | null | undefined, email: string | null | undefined): string | null {
  if (whatsapp) return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  if (email) return `mailto:${email}`;
  return null;
}

// ---------- Publicaciones ----------

function AdminListingRow({
  listing: l,
  expanded,
  onToggle,
  onSaved,
}: {
  listing: ListingWithPublisher;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState("");
  const [historial, setHistorial] = useState<ModeracionLogRow[]>([]);
  const [form, setForm] = useState({
    nombre: l.nombre,
    descripcion: l.descripcion,
    categoria: l.categoria || "",
    subcategoria: l.subcategoria || "",
    precio: l.precio ? String(l.precio) : "",
    precioConsultar: l.precio_a_consultar,
    zona: l.zona,
    cuadrante: l.cuadrante || "",
    direccion: l.direccion || "",
    tags: l.tags.join(", "),
  });

  const loadHistorial = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("moderacion_log")
      .select("*")
      .eq("entity_type", "listing")
      .eq("entity_id", l.id)
      .order("created_at", { ascending: false });
    setHistorial(data || []);
  }, [l.id]);

  useEffect(() => {
    if (expanded) loadHistorial();
  }, [expanded, loadHistorial]);

  async function guardarCambios() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_update_listing", {
      p_listing_id: l.id,
      p_nombre: form.nombre,
      p_descripcion: form.descripcion,
      p_categoria: form.categoria || null,
      p_subcategoria: form.subcategoria || null,
      p_precio: form.precio ? Number(form.precio) : null,
      p_precio_a_consultar: form.precioConsultar,
      p_zona: form.zona,
      p_cuadrante: form.cuadrante || null,
      p_direccion: form.direccion || null,
      p_tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      onSaved();
      loadHistorial();
    }
  }

  async function cambiarEstado(status: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_listing_status", { p_listing_id: l.id, p_status: status });
    setSaving(false);
    if (error) alert(error.message);
    else {
      onSaved();
      loadHistorial();
    }
  }

  async function toggleSello() {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_sello", { p_listing_id: l.id, p_value: !l.sello });
    if (error) alert(error.message);
    else onSaved();
  }

  async function toggleDestacada() {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_destacada", { p_listing_id: l.id, p_value: !l.destacada });
    if (error) alert(error.message);
    else onSaved();
  }

  async function agregarNota() {
    if (!nota.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_add_nota", { p_entity_type: "listing", p_entity_id: l.id, p_nota: nota });
    if (error) alert(error.message);
    else {
      setNota("");
      loadHistorial();
    }
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const supabase = createClient();
    const path = `admin/${l.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (uploadError) {
      alert(uploadError.message);
      setSaving(false);
      return;
    }
    const fotoUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.rpc("admin_update_listing", { p_listing_id: l.id, p_foto_url: fotoUrl });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
  }

  const link = contactUrl(l.profiles?.whatsapp_number, l.profiles?.email);

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">
            {l.nombre} {l.destacada && <i className="ti ti-star-filled text-dorado" aria-hidden />} {l.sello && <i className="ti ti-seal text-oliva" aria-hidden />}
          </p>
          <p className="text-xs text-tinta-suave">
            {l.intencion} · {l.tipo || "—"} · {l.categoria || "—"} / {l.subcategoria || "—"} · {l.zona}
          </p>
          <p className="text-xs text-tinta-suave">
            {l.profiles?.full_name || "?"} ({l.profiles?.email || "sin email"})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">{LISTING_STATUS_LABELS[l.status]}</span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Editar"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <div className="flex flex-wrap gap-2">
            {LISTING_STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                disabled={saving}
                onClick={() => cambiarEstado(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${l.status === s ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 text-tinta"}`}
              >
                {LISTING_STATUS_LABELS[s]}
              </button>
            ))}
            <button onClick={toggleDestacada} className={`rounded-lg border px-2.5 py-1.5 text-xs ${l.destacada ? "border-dorado bg-dorado text-white" : "border-piedra/70 text-tinta"}`}>
              <i className="ti ti-star" aria-hidden /> Destacada
            </button>
            <button onClick={toggleSello} className={`rounded-lg border px-2.5 py-1.5 text-xs ${l.sello ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 text-tinta"}`}>
              <i className="ti ti-seal" aria-hidden /> Selección Origen
            </button>
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-golfo px-2.5 py-1.5 text-xs text-golfo">
                <i className="ti ti-brand-whatsapp" aria-hidden /> Contactar publicador
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LabeledInput label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
            <LabeledInput label="Zona" value={form.zona} onChange={(v) => setForm({ ...form, zona: v })} />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              >
                <option value="">(sin categoría)</option>
                {(Object.entries(CATEGORIES) as [CategoryKey, (typeof CATEGORIES)[CategoryKey]][]).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <LabeledInput label="Subcategoría" value={form.subcategoria} onChange={(v) => setForm({ ...form, subcategoria: v })} />
            <LabeledInput label="Precio" type="number" value={form.precio} onChange={(v) => setForm({ ...form, precio: v })} />
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-tinta">
                <input type="checkbox" checked={form.precioConsultar} onChange={(e) => setForm({ ...form, precioConsultar: e.target.checked })} />
                Precio a consultar
              </label>
            </div>
            <LabeledInput label="Cuadrante" value={form.cuadrante} onChange={(v) => setForm({ ...form, cuadrante: v })} />
            <LabeledInput label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="min-h-[60px] w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            />
          </div>
          <LabeledInput label="Palabras clave (separadas por coma)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />

          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Foto (cargar/reemplazar en nombre del vecino)</label>
            <input type="file" accept="image/*" onChange={subirFoto} className="text-xs" />
          </div>

          <button onClick={guardarCambios} disabled={saving} className="w-fit rounded-lg bg-oliva px-4 py-2 text-xs font-semibold text-hueso disabled:bg-piedra">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <div className="border-t border-piedra/40 pt-3">
            <label className="mb-1 block text-[11px] font-medium text-tinta">Nota interna (no visible al público)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: hablé con el vecino, va a subir mejores fotos"
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              />
              <button onClick={agregarNota} className="flex-shrink-0 rounded-lg border border-piedra/70 px-3 py-1.5 text-xs text-tinta">
                Agregar
              </button>
            </div>
            {historial.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {historial.map((h) => (
                  <p key={h.id} className="text-[11px] text-tinta-suave">
                    <span className="font-medium text-tinta">{h.accion}</span>
                    {h.detalle ? ` — ${h.detalle}` : ""} · {new Date(h.created_at).toLocaleString("es-AR")}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Anuncios ----------

function AdminAnuncioRow({
  anuncio: a,
  expanded,
  onToggle,
  onSaved,
}: {
  anuncio: AnuncioWithSolicitante;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState("");
  const [historial, setHistorial] = useState<ModeracionLogRow[]>([]);
  const [form, setForm] = useState({
    titulo: a.titulo,
    descripcion: a.descripcion,
    lugar: a.lugar || "",
    orden: String(a.orden),
  });

  const loadHistorial = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("moderacion_log")
      .select("*")
      .eq("entity_type", "anuncio")
      .eq("entity_id", a.id)
      .order("created_at", { ascending: false });
    setHistorial(data || []);
  }, [a.id]);

  useEffect(() => {
    if (expanded) loadHistorial();
  }, [expanded, loadHistorial]);

  async function guardarCambios() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_process_anuncio", {
      p_anuncio_id: a.id,
      p_titulo: form.titulo,
      p_descripcion: form.descripcion,
      p_lugar: form.lugar || null,
      p_orden: form.orden ? Number(form.orden) : null,
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      onSaved();
      loadHistorial();
    }
  }

  async function cambiarEstado(status: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_process_anuncio", { p_anuncio_id: a.id, p_status: status });
    setSaving(false);
    if (error) alert(error.message);
    else {
      onSaved();
      loadHistorial();
    }
  }

  async function agregarNota() {
    if (!nota.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_add_nota", { p_entity_type: "anuncio", p_entity_id: a.id, p_nota: nota });
    if (error) alert(error.message);
    else {
      setNota("");
      loadHistorial();
    }
  }

  const link = contactUrl(a.profiles?.whatsapp_number, a.profiles?.email);

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">{a.titulo}</p>
          <p className="text-xs text-tinta-suave">{a.tipo}</p>
          <p className="text-xs text-tinta-suave">Solicitado por {a.profiles?.full_name || a.profiles?.email || "?"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">{ANUNCIO_STATUS_LABELS[a.status]}</span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Gestionar"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <div className="flex flex-wrap gap-2">
            {ANUNCIO_STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                disabled={saving}
                onClick={() => cambiarEstado(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${a.status === s ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 text-tinta"}`}
              >
                {ANUNCIO_STATUS_LABELS[s]}
              </button>
            ))}
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-golfo px-2.5 py-1.5 text-xs text-golfo">
                <i className="ti ti-brand-whatsapp" aria-hidden /> Contactar solicitante
              </a>
            )}
          </div>

          <LabeledInput label="Título" value={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />
          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="min-h-[60px] w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="Lugar" value={form.lugar} onChange={(v) => setForm({ ...form, lugar: v })} />
            <LabeledInput label="Orden en el carrusel" type="number" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} />
          </div>

          <button onClick={guardarCambios} disabled={saving} className="w-fit rounded-lg bg-oliva px-4 py-2 text-xs font-semibold text-hueso disabled:bg-piedra">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <div className="border-t border-piedra/40 pt-3">
            <label className="mb-1 block text-[11px] font-medium text-tinta">Nota interna</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: acordamos publicarlo la semana que viene"
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              />
              <button onClick={agregarNota} className="flex-shrink-0 rounded-lg border border-piedra/70 px-3 py-1.5 text-xs text-tinta">
                Agregar
              </button>
            </div>
            {historial.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {historial.map((h) => (
                  <p key={h.id} className="text-[11px] text-tinta-suave">
                    <span className="font-medium text-tinta">{h.accion}</span>
                    {h.detalle ? ` — ${h.detalle}` : ""} · {new Date(h.created_at).toLocaleString("es-AR")}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-tinta">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
      />
    </div>
  );
}
