"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCategories } from "@/lib/useCategories";
import { createClient } from "@/lib/supabase/client";
import type {
  AnuncioRow,
  CategoryRow,
  ListingReportRow,
  ListingRow,
  ModeracionLogRow,
  ProfileRow,
  ReviewReportRow,
  SubcategoryRow,
  SupportRequestRow,
  UserVerificationRow,
  ZoneRow,
} from "@/lib/supabase/types";
import { REPORT_MOTIVO_LABELS, requiereSuspensionReciproca } from "@/lib/reportMotivos";
import type { Anuncio, AnuncioLayoutType, ImageOrientation, TipoAnuncio, TipoPublicacion } from "@/lib/types";
import { TIPO_OPTIONS } from "@/lib/tipos";
import { SITE_URL } from "@/lib/seo";
import { resizeImage } from "@/lib/resizeImage";
import { uploadCoverPhoto } from "@/lib/uploadCoverPhoto";
import { containsPhoneNumber, maskPhoneNumbers } from "@/lib/phoneDetection";
import AnuncioSlide, { TIPO_LABEL, CARTEL_FLYER_ASPECT } from "./AnuncioSlide";
import PhotoCropModal from "./PhotoCropModal";
import { LISTING_COVER_PREVIEW_PANELS } from "./listingCoverPreviewPanels";
import { urlToFile } from "@/lib/urlToFile";

type Tab =
  | "publicaciones"
  | "anuncios"
  | "denuncias"
  | "verificaciones"
  | "reseñas"
  | "soporte"
  | "metricas"
  | "usuarios"
  | "categorias";

const REVIEW_MOTIVO_LABELS: Record<string, string> = {
  informacion_falsa: "Información falsa",
  contenido_inapropiado: "Contenido inapropiado",
  sospecha_falsa: "Sospecha de reseña falsa",
  otro: "Otro",
};

const REVIEW_REPORT_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  resuelta: "Resuelta (reseña oculta)",
  rechazada: "Rechazada",
};
const REVIEW_REPORT_STATUS_OPTIONS = ["resuelta", "rechazada"];

const NIVEL_LABELS: Record<number, string> = { 2: "Nivel 2 · Publicador verificado", 3: "Nivel 3 · Verificación reforzada" };

const REPORT_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelta: "Resuelta",
  rechazada: "Rechazada",
};
const REPORT_STATUS_OPTIONS = Object.keys(REPORT_STATUS_LABELS);

const LISTING_STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  activa: "Activa",
  observada: "Observada",
  rechazada: "Rechazada",
  pausada: "Pausada",
  vencida: "Vencida",
  eliminada: "Eliminada",
  resuelta: "Resuelta/Vendida",
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

const ANUNCIO_LAYOUT_LABELS: Record<string, string> = {
  flyer_on_sign: "Flyer vertical (con cartel)",
  full_banner: "Banner horizontal completo",
  background_image: "Imagen de fondo + placa de texto",
  text_only: "Solo texto (institucional)",
};
const ANUNCIO_LAYOUT_OPTIONS = Object.keys(ANUNCIO_LAYOUT_LABELS);

const IMAGE_ORIENTATION_LABELS: Record<string, string> = {
  vertical: "Vertical (4:5, flyer)",
  horizontal: "Horizontal",
  square: "Cuadrada",
};

function detectImageOrientation(file: File): Promise<"vertical" | "horizontal" | "square"> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth > img.naturalHeight) resolve("horizontal");
      else if (img.naturalHeight > img.naturalWidth) resolve("vertical");
      else resolve("square");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("horizontal");
    };
    img.src = url;
  });
}

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

const ROLE_OPTIONS = ["publicador", "admin", "superadmin"];

// Sugerencias comunes de ícono (Tabler Icons) para no tener que saber el
// nombre exacto de memoria — el campo sigue siendo texto libre por si
// necesitan uno que no está en esta lista.
const ICON_SUGGESTIONS = [
  "ti-box",
  "ti-droplet",
  "ti-egg",
  "ti-flower",
  "ti-carrot",
  "ti-wheat",
  "ti-plant",
  "ti-bread",
  "ti-soup",
  "ti-jar",
  "ti-tools",
  "ti-hammer",
  "ti-bolt",
  "ti-scissors",
  "ti-paw",
  "ti-truck",
  "ti-truck-delivery",
  "ti-spray",
  "ti-brick",
  "ti-recycle",
  "ti-building-store",
  "ti-package",
  "ti-tool",
  "ti-horse",
  "ti-binoculars",
  "ti-car",
  "ti-confetti",
  "ti-home",
  "ti-building",
  "ti-tent",
  "ti-key",
  "ti-map-2",
  "ti-fence",
  "ti-shopping-bag",
  "ti-compass",
];

type ListingWithPublisher = ListingRow & { profiles: { full_name: string | null; email: string | null; whatsapp_number: string | null } | null };
type AnuncioWithSolicitante = AnuncioRow & { profiles: { full_name: string | null; email: string | null; whatsapp_number: string | null } | null };
type SupportRequestWithUser = SupportRequestRow & {
  profiles: {
    full_name: string | null;
    email: string | null;
    whatsapp_number: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
  } | null;
};
type ReportWithDetails = ListingReportRow & {
  profiles: { full_name: string | null; email: string | null } | null;
  listings: { nombre: string; publisher_id: string } | null;
};
type VerificationWithUser = UserVerificationRow & {
  profiles: { full_name: string | null; email: string | null; whatsapp_number: string | null } | null;
};
type ReviewReportWithDetails = ReviewReportRow & {
  profiles: { full_name: string | null; email: string | null } | null;
  reviews: { rating: number; comentario: string | null; estado: string; target_user_id: string } | null;
};

interface AdminClientProps {
  role: string;
  currentUserId: string;
}

export default function AdminClient({ role, currentUserId }: AdminClientProps) {
  const { categories } = useCategories();
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [listings, setListings] = useState<ListingWithPublisher[]>([]);
  const [anuncios, setAnuncios] = useState<AnuncioWithSolicitante[]>([]);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [verifications, setVerifications] = useState<VerificationWithUser[]>([]);
  const [reviewReports, setReviewReports] = useState<ReviewReportWithDetails[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequestWithUser[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [expandedAnuncio, setExpandedAnuncio] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [expandedVerification, setExpandedVerification] = useState<string | null>(null);
  const [expandedReviewReport, setExpandedReviewReport] = useState<string | null>(null);
  const [expandedSupportRequest, setExpandedSupportRequest] = useState<string | null>(null);
  const [mostrarVerificacionesResueltas, setMostrarVerificacionesResueltas] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroDestacada, setFiltroDestacada] = useState("todas");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserWhatsapp, setNewUserWhatsapp] = useState("");
  const [newUserRole, setNewUserRole] = useState("publicador");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; tempPassword: string } | null>(null);
  const isSuperadmin = role === "superadmin";

  const loadListings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select("*, profiles!listings_publisher_id_fkey(full_name, email, whatsapp_number)")
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

  const loadReports = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listing_reports")
      .select("*, profiles(full_name, email), listings(nombre, publisher_id)")
      .order("created_at", { ascending: false });
    setReports((data as never as ReportWithDetails[]) || []);
  }, []);

  const loadVerifications = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("user_verifications")
      .select("*, profiles!user_verifications_user_id_fkey(full_name, email, whatsapp_number)")
      .order("created_at", { ascending: false });
    setVerifications((data as never as VerificationWithUser[]) || []);
  }, []);

  const loadReviewReports = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("review_reports")
      .select("*, profiles!review_reports_reporter_id_fkey(full_name, email), reviews(rating, comentario, estado, target_user_id)")
      .order("created_at", { ascending: false });
    setReviewReports((data as never as ReviewReportWithDetails[]) || []);
  }, []);

  const loadSupportRequests = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("support_requests")
      .select("*, profiles!support_requests_user_id_fkey(full_name, email, whatsapp_number, instagram_url, facebook_url)")
      .order("created_at", { ascending: false });
    setSupportRequests((data as never as SupportRequestWithUser[]) || []);
  }, []);

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }, []);

  useEffect(() => {
    Promise.all([
      loadListings(),
      loadAnuncios(),
      loadReports(),
      loadVerifications(),
      loadReviewReports(),
      loadSupportRequests(),
      loadUsers(),
    ]).finally(() => setLoading(false));
  }, [loadListings, loadAnuncios, loadReports, loadVerifications, loadReviewReports, loadSupportRequests, loadUsers]);

  function downloadUsersCsv() {
    // Excel en español/Argentina usa ";" como separador de listas al abrir un
    // CSV con doble click (usa la config regional del sistema, no la coma
    // "de fábrica"); con "," todo termina amontonado en una sola columna.
    const headers = ["Nombre", "Nombre público", "Email", "WhatsApp", "Rol", "Nivel", "Barrio", "Calificación", "Reseñas", "Bloqueado", "Creado"];
    const rows = users.map((u) => [
      u.full_name || "",
      u.nickname || "",
      u.email || "",
      u.whatsapp_number || "",
      u.role,
      String(u.verification_level),
      u.zona || "",
      u.rating_promedio != null ? u.rating_promedio.toFixed(1) : "",
      String(u.resenas_count),
      u.blocked_at ? "Sí" : "No",
      new Date(u.created_at).toLocaleDateString("es-AR"),
    ]);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-origen-el-doradillo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function changeRole(userId: string, newRole: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: newRole });
    if (error) alert(error.message);
    else await loadUsers();
  }

  async function toggleBlocked(userId: string, blocked: boolean) {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_blocked", { p_user_id: userId, p_blocked: blocked });
    if (error) alert(error.message);
    else await loadUsers();
  }

  async function deleteUser(userId: string, label: string) {
    if (!confirm(`¿Eliminar definitivamente a ${label}? También se borran todas sus publicaciones. Esta acción no se puede deshacer.`)) return;
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || "No se pudo eliminar el usuario.");
      return;
    }
    await Promise.all([loadUsers(), loadListings()]);
  }

  async function updateProfileField(userId: string, patch: { full_name?: string; whatsapp_number?: string }) {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_update_profile", {
      p_user_id: userId,
      p_full_name: patch.full_name,
      p_whatsapp_number: patch.whatsapp_number,
    });
    if (error) alert(error.message);
    else await loadUsers();
  }

  async function createUser() {
    if (!newUserEmail.trim()) return;
    setCreatingUser(true);
    setCreateUserError("");
    setCreatedCredentials(null);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newUserEmail, fullName: newUserName, whatsapp: newUserWhatsapp, role: newUserRole }),
    });
    const body = await res.json();
    setCreatingUser(false);
    if (!res.ok) {
      setCreateUserError(body.error || "No se pudo crear el usuario.");
      return;
    }
    setCreatedCredentials({ email: body.email, tempPassword: body.tempPassword });
    setNewUserEmail("");
    setNewUserName("");
    setNewUserWhatsapp("");
    setNewUserRole("publicador");
    await loadUsers();
  }

  const pendingListings = listings.filter((l) => l.status === "activa" && Date.now() - new Date(l.created_at).getTime() < 1000 * 60 * 60 * 24);
  const solicitadosAnuncios = anuncios.filter((a) => a.status === "solicitado" || a.status === "en_conversacion");
  const denunciasPendientes = reports.filter((r) => r.estado === "pendiente" || r.estado === "en_revision");
  const verificacionesPendientes = verifications.filter((v) => v.estado === "pendiente");
  const reseñasPendientes = reviewReports.filter((r) => r.estado === "pendiente");
  const soportePendientes = supportRequests.filter((s) => s.estado === "pendiente");

  const pendingListingIds = new Set(pendingListings.map((l) => l.id));
  const hayFiltrosActivos =
    filtroTexto.trim() !== "" ||
    filtroEstado !== "todos" ||
    filtroCategoria !== "todas" ||
    filtroTipo !== "todos" ||
    filtroDesde !== "" ||
    filtroHasta !== "" ||
    filtroDestacada !== "todas";
  const filteredListings = listings.filter((l) => {
    // Sin filtros activos no repetimos las publicadas en las últimas 24h (ya
    // están arriba); pero si el admin está buscando/filtrando algo puntual,
    // que sí aparezcan acá — si no, una publicación recién publicada era
    // imposible de encontrar por nombre o estado.
    if (!hayFiltrosActivos && pendingListingIds.has(l.id)) return false;
    if (filtroEstado !== "todos" && l.status !== filtroEstado) return false;
    if (filtroCategoria !== "todas" && l.categoria !== filtroCategoria) return false;
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
    if (filtroDestacada === "si" && !l.destacada) return false;
    if (filtroDestacada === "no" && l.destacada) return false;
    if (filtroTexto.trim()) {
      const q = filtroTexto.trim().toLowerCase();
      const haystack = `${l.nombre} ${l.profiles?.full_name || ""} ${l.profiles?.email || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filtroDesde && new Date(l.created_at) < new Date(filtroDesde)) return false;
    if (filtroHasta && new Date(l.created_at) > new Date(`${filtroHasta}T23:59:59`)) return false;
    return true;
  });

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
          <TabButton active={tab === "denuncias"} onClick={() => setTab("denuncias")}>
            Denuncias {denunciasPendientes.length > 0 && `(${denunciasPendientes.length})`}
          </TabButton>
          <TabButton active={tab === "verificaciones"} onClick={() => setTab("verificaciones")}>
            Verificaciones {verificacionesPendientes.length > 0 && `(${verificacionesPendientes.length})`}
          </TabButton>
          <TabButton active={tab === "reseñas"} onClick={() => setTab("reseñas")}>
            Reseñas {reseñasPendientes.length > 0 && `(${reseñasPendientes.length})`}
          </TabButton>
          <TabButton active={tab === "soporte"} onClick={() => setTab("soporte")}>
            Soporte {soportePendientes.length > 0 && `(${soportePendientes.length})`}
          </TabButton>
          <TabButton active={tab === "metricas"} onClick={() => setTab("metricas")}>
            Métricas
          </TabButton>
          {isSuperadmin && (
            <TabButton active={tab === "usuarios"} onClick={() => setTab("usuarios")}>
              Usuarios
            </TabButton>
          )}
          {isSuperadmin && (
            <TabButton active={tab === "categorias"} onClick={() => setTab("categorias")}>
              Categorías
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
                      users={users}
                      isSuperadmin={isSuperadmin}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">
                Todas las publicaciones ({filteredListings.length} de {listings.length})
              </h2>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar por nombre o usuario"
                  className="w-48 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  <option value="todos">Todos los estados</option>
                  {LISTING_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {LISTING_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  <option value="todas">Todas las categorías</option>
                  {Object.entries(categories).map(([key, c]) => (
                    <option key={key} value={key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  <option value="todos">Todos los tipos</option>
                  {TIPO_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroDestacada}
                  onChange={(e) => setFiltroDestacada(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  <option value="todas">Destacada: todas</option>
                  <option value="si">Solo destacadas</option>
                  <option value="no">Solo no destacadas</option>
                </select>
                <input
                  type="date"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
                <input
                  type="date"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
              </div>
              <div className="flex flex-col gap-2">
                {filteredListings.map((l) => (
                  <AdminListingRow
                    key={l.id}
                    listing={l}
                    expanded={expandedListing === l.id}
                    onToggle={() => setExpandedListing(expandedListing === l.id ? null : l.id)}
                    onSaved={loadListings}
                    users={users}
                    isSuperadmin={isSuperadmin}
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
                isSuperadmin={isSuperadmin}
              />
            ))}
          </div>
        ) : tab === "denuncias" ? (
          <div className="flex flex-col gap-2">
            {reports.length === 0 && <p className="text-sm text-tinta-suave">Todavía no hay denuncias.</p>}
            {reports.map((r) => (
              <AdminReportRow
                key={r.id}
                report={r}
                expanded={expandedReport === r.id}
                onToggle={() => setExpandedReport(expandedReport === r.id ? null : r.id)}
                onSaved={loadReports}
                isSuperadmin={isSuperadmin}
              />
            ))}
          </div>
        ) : tab === "verificaciones" ? (
          <div className="flex flex-col gap-2">
            <label className="mb-1 flex w-fit items-center gap-1.5 text-xs text-tinta-suave">
              <input
                type="checkbox"
                checked={mostrarVerificacionesResueltas}
                onChange={(e) => setMostrarVerificacionesResueltas(e.target.checked)}
              />
              Mostrar también las ya resueltas
            </label>
            {(mostrarVerificacionesResueltas ? verifications : verifications.filter((v) => v.estado === "pendiente")).length === 0 && (
              <p className="text-sm text-tinta-suave">
                {mostrarVerificacionesResueltas ? "Todavía no hay solicitudes de verificación." : "No hay solicitudes pendientes."}
              </p>
            )}
            {(mostrarVerificacionesResueltas ? verifications : verifications.filter((v) => v.estado === "pendiente")).map((v) => (
              <AdminVerificationRow
                key={v.id}
                verification={v}
                expanded={expandedVerification === v.id}
                onToggle={() => setExpandedVerification(expandedVerification === v.id ? null : v.id)}
                onSaved={loadVerifications}
              />
            ))}
          </div>
        ) : tab === "reseñas" ? (
          <div className="flex flex-col gap-2">
            {reviewReports.length === 0 && <p className="text-sm text-tinta-suave">Todavía no hay reportes de reseñas.</p>}
            {reviewReports.map((r) => (
              <AdminReviewReportRow
                key={r.id}
                report={r}
                expanded={expandedReviewReport === r.id}
                onToggle={() => setExpandedReviewReport(expandedReviewReport === r.id ? null : r.id)}
                onSaved={loadReviewReports}
              />
            ))}
          </div>
        ) : tab === "soporte" ? (
          <div className="flex flex-col gap-2">
            {supportRequests.length === 0 && <p className="text-sm text-tinta-suave">Todavía no hay mensajes de soporte.</p>}
            {supportRequests.map((s) => (
              <AdminSupportRequestRow
                key={s.id}
                request={s}
                expanded={expandedSupportRequest === s.id}
                onToggle={() => setExpandedSupportRequest(expandedSupportRequest === s.id ? null : s.id)}
                onSaved={loadSupportRequests}
              />
            ))}
          </div>
        ) : tab === "metricas" ? (
          <MetricasTab
            listings={listings}
            users={users}
            denunciasPendientes={denunciasPendientes.length}
            verificacionesPendientes={verificacionesPendientes.length}
            reseñasPendientes={reseñasPendientes.length}
            categories={categories}
          />
        ) : tab === "usuarios" ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-slab text-sm font-semibold uppercase tracking-wide text-piedra">Usuarios</h2>
              <button onClick={downloadUsersCsv} className="rounded-lg border border-piedra/70 px-3 py-1.5 text-xs font-medium text-tinta">
                <i className="ti ti-download mr-1" aria-hidden /> Descargar CSV
              </button>
            </div>
            <div className="rounded-lg border border-dashed border-piedra/70 p-3">
              <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">Crear usuario</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Email"
                  className="w-52 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nombre"
                  className="w-40 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
                <input
                  value={newUserWhatsapp}
                  onChange={(e) => setNewUserWhatsapp(e.target.value)}
                  placeholder="WhatsApp"
                  className="w-36 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={createUser}
                  disabled={creatingUser}
                  className="rounded-lg bg-oliva px-3 py-1.5 text-xs font-semibold text-hueso disabled:bg-piedra"
                >
                  {creatingUser ? "Creando..." : "Crear usuario"}
                </button>
              </div>
              {createUserError && <p className="mt-2 text-xs text-red-700">{createUserError}</p>}
              {createdCredentials && (
                <p className="mt-2 rounded-lg bg-[#F1F4EE] px-3 py-2 text-xs text-tinta">
                  Usuario creado: <strong>{createdCredentials.email}</strong> · Contraseña temporal:{" "}
                  <strong>{createdCredentials.tempPassword}</strong> — copiala ahora, no se vuelve a mostrar. Va a tener que
                  cambiarla al ingresar.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-piedra/50 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      defaultValue={u.full_name || ""}
                      onBlur={(e) => e.target.value.trim() !== (u.full_name || "") && updateProfileField(u.id, { full_name: e.target.value.trim() })}
                      placeholder="(sin nombre)"
                      className="w-36 rounded-lg border border-piedra/70 px-2 py-1 text-xs text-tinta"
                    />
                    <input
                      defaultValue={u.whatsapp_number || ""}
                      onBlur={(e) =>
                        e.target.value.trim() !== (u.whatsapp_number || "") && updateProfileField(u.id, { whatsapp_number: e.target.value.trim() })
                      }
                      placeholder="WhatsApp"
                      className="w-32 rounded-lg border border-piedra/70 px-2 py-1 text-xs text-tinta"
                    />
                    <div>
                      <p className="text-xs text-tinta-suave">{u.email}</p>
                      {u.blocked_at && <p className="text-[10px] font-medium text-red-700">Bloqueado</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => toggleBlocked(u.id, !u.blocked_at)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs ${u.blocked_at ? "border-oliva text-oliva" : "border-red-700 text-red-700"}`}
                    >
                      {u.blocked_at ? "Desbloquear" : "Bloquear"}
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => deleteUser(u.id, u.full_name || u.email || u.id)}
                        className="rounded-lg border border-red-700 bg-red-700 px-2.5 py-1.5 text-xs text-hueso"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CategoriasAdmin />
        )}
      </div>
    </div>
  );
}

function MetricasTab({
  listings,
  users,
  denunciasPendientes,
  verificacionesPendientes,
  reseñasPendientes,
  categories,
}: {
  listings: ListingWithPublisher[];
  users: ProfileRow[];
  denunciasPendientes: number;
  verificacionesPendientes: number;
  reseñasPendientes: number;
  categories: Record<string, { label: string }>;
}) {
  const [loading, setLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState({ total: 0, ultimos7: 0 });
  const [visitas, setVisitas] = useState({ total: 0, ultimos7: 0 });

  useEffect(() => {
    const supabase = createClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("whatsapp_clicks").select("*", { count: "exact", head: true }),
      supabase.from("whatsapp_clicks").select("*", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("site_visits").select("*", { count: "exact", head: true }),
      supabase.from("site_visits").select("*", { count: "exact", head: true }).gte("created_at", since),
    ]).then(([wcTotal, wc7, svTotal, sv7]) => {
      setWhatsapp({ total: wcTotal.count || 0, ultimos7: wc7.count || 0 });
      setVisitas({ total: svTotal.count || 0, ultimos7: sv7.count || 0 });
      setLoading(false);
    });
  }, []);

  const activas = listings.filter((l) => l.status === "activa").length;
  const enRevision = listings.filter((l) => l.status === "en_revision" || l.status === "observada").length;
  const pausadas = listings.filter((l) => l.status === "pausada").length;
  const vencidas = listings.filter((l) => l.status === "vencida").length;
  const totalVistas = listings.reduce((sum, l) => sum + l.views_count, 0);
  const nuevosUsuarios7d = users.filter((u) => Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;

  const topCategorias = Object.entries(
    listings
      .filter((l) => l.status === "activa")
      .reduce((acc: Record<string, number>, l) => {
        const key = l.categoria || "(sin categoría)";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Publicaciones activas" value={activas} icon="ti-list-check" />
        <MetricCard label="En revisión" value={enRevision} icon="ti-eye-search" />
        <MetricCard label="Pausadas" value={pausadas} icon="ti-player-pause" />
        <MetricCard label="Vencidas" value={vencidas} icon="ti-clock-x" />
        <MetricCard label="Usuarios" value={users.length} sub={`+${nuevosUsuarios7d} en 7 días`} icon="ti-users" />
        <MetricCard label="Vistas de publicaciones" value={totalVistas} icon="ti-eye" />
        <MetricCard
          label="Clics a WhatsApp"
          value={loading ? "…" : whatsapp.total}
          sub={loading ? undefined : `+${whatsapp.ultimos7} en 7 días`}
          icon="ti-brand-whatsapp"
        />
        <MetricCard
          label="Visitas al sitio"
          value={loading ? "…" : visitas.total}
          sub={loading ? undefined : `+${visitas.ultimos7} en 7 días`}
          icon="ti-world"
        />
        <MetricCard label="Denuncias pendientes" value={denunciasPendientes} icon="ti-flag" />
        <MetricCard label="Verificaciones pendientes" value={verificacionesPendientes} icon="ti-shield-check" />
        <MetricCard label="Reseñas reportadas" value={reseñasPendientes} icon="ti-star" />
      </div>

      <div>
        <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">Top categorías (activas)</h2>
        {topCategorias.length === 0 ? (
          <p className="text-sm text-tinta-suave">Todavía no hay publicaciones activas.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {topCategorias.map(([key, count]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-piedra/50 bg-white px-3 py-2 text-sm text-tinta">
                <span>{categories[key]?.label || key}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) {
  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-piedra">
        <i className={`ti ${icon}`} aria-hidden /> {label}
      </div>
      <p className="font-slab text-xl font-semibold text-tinta">{value}</p>
      {sub && <p className="text-[11px] text-tinta-suave">{sub}</p>}
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

// El campo "contacto" del formulario de soporte es texto libre ("WhatsApp
// o email"), y si quien escribió estaba logueado puede tener además
// WhatsApp/email/redes en su perfil. Se devuelven TODAS las vías
// posibles (no solo la "mejor") para que si una falta o no sirve, el
// admin tenga otra a mano — nunca queda sin ninguna opción, porque el
// texto libre que haya escrito siempre se muestra igual (arriba, en el
// encabezado de la fila) aunque no se pueda armar un link con él.
function supportContactOptions(s: SupportRequestWithUser): { label: string; url: string }[] {
  const opciones: { label: string; url: string }[] = [];
  if (s.profiles?.whatsapp_number) {
    opciones.push({ label: "WhatsApp del perfil", url: `https://wa.me/${s.profiles.whatsapp_number.replace(/\D/g, "")}` });
  }
  if (s.profiles?.email) {
    opciones.push({ label: "Email del perfil", url: `mailto:${s.profiles.email}` });
  }
  const contacto = s.contacto.trim();
  if (contacto) {
    if (contacto.includes("@")) {
      opciones.push({ label: `Lo que escribió: ${contacto}`, url: `mailto:${contacto}` });
    } else {
      const digits = contacto.replace(/\D/g, "");
      if (digits.length >= 6) opciones.push({ label: `Lo que escribió: ${contacto}`, url: `https://wa.me/${digits}` });
    }
  }
  if (s.profiles?.instagram_url) opciones.push({ label: "Instagram", url: s.profiles.instagram_url });
  if (s.profiles?.facebook_url) opciones.push({ label: "Facebook", url: s.profiles.facebook_url });
  return opciones;
}

// ---------- Categorías / zonas (solo superadmin) ----------

function CategoriasAdmin() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subs, setSubs] = useState<SubcategoryRow[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatTipos, setNewCatTipos] = useState<TipoPublicacion[]>([]);
  const [newSubLabel, setNewSubLabel] = useState<Record<string, string>>({});
  const [newZoneLabel, setNewZoneLabel] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [catRes, subRes, zoneRes] = await Promise.all([
      supabase.from("categories").select("*").order("orden"),
      supabase.from("subcategories").select("*").order("orden"),
      supabase.from("zones").select("*").order("orden"),
    ]);
    setCategories(catRes.data || []);
    setSubs(subRes.data || []);
    setZones(zoneRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addCategory() {
    if (!newCatLabel.trim() || !newCatIcon.trim()) return;
    const id = newCatLabel
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!id) {
      alert("Ese nombre no tiene ninguna letra o número — probá con otro.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert({
      id,
      label: newCatLabel.trim(),
      icon: newCatIcon.trim(),
      orden: categories.length + 1,
      tipo_scope: newCatTipos,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setNewCatLabel("");
    setNewCatIcon("");
    setNewCatTipos([]);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría? También se borran sus subcategorías.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function updateCategory(id: string, patch: { label?: string; icon?: string; tipo_scope?: string[] }) {
    const supabase = createClient();
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  function toggleCategoryTipo(c: CategoryRow, t: TipoPublicacion) {
    const current = c.tipo_scope || [];
    const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t];
    updateCategory(c.id, { tipo_scope: next });
  }

  async function addSub(categoryId: string) {
    const label = (newSubLabel[categoryId] || "").trim();
    if (!label) return;
    const supabase = createClient();
    const orden = subs.filter((s) => s.category_id === categoryId).length + 1;
    const { error } = await supabase.from("subcategories").insert({ category_id: categoryId, label, orden });
    if (error) alert(error.message);
    else {
      setNewSubLabel((p) => ({ ...p, [categoryId]: "" }));
      load();
    }
  }

  async function deleteSub(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("subcategories").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function addZone() {
    if (!newZoneLabel.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("zones").insert({ label: newZoneLabel.trim(), orden: zones.length + 1 });
    if (error) alert(error.message);
    else {
      setNewZoneLabel("");
      load();
    }
  }

  async function deleteZone(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function moveZone(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= zones.length) return;
    const a = zones[index];
    const b = zones[target];
    const supabase = createClient();
    const [res1, res2] = await Promise.all([
      supabase.from("zones").update({ orden: b.orden }).eq("id", a.id),
      supabase.from("zones").update({ orden: a.orden }).eq("id", b.id),
    ]);
    if (res1.error || res2.error) alert(res1.error?.message || res2.error?.message);
    else load();
  }

  if (loading) return <p className="text-sm text-tinta-suave">Cargando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">Categorías</h2>
        <p className="mb-3 text-[11px] text-tinta-suave">
          Cada categoría pertenece a uno o más Tipos de publicación — eso decide en qué Tipo la ve quien publica o filtra.
          Se agrupan abajo por Tipo (una categoría con varios tipos marcados aparece en más de un grupo).
        </p>
        {TIPO_OPTIONS.map((t) => {
          const catsForTipo = categories.filter((c) => (c.tipo_scope || []).includes(t.value));
          if (catsForTipo.length === 0) return null;
          return (
            <div key={t.value} className="mb-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-oliva">
                <i className={`ti ${t.icon}`} aria-hidden /> {t.label}
              </h3>
              <div className="flex flex-col gap-2">
                {catsForTipo.map((c) => (
                  <CategoryCard
                    key={c.id}
                    c={c}
                    subs={subs.filter((s) => s.category_id === c.id)}
                    newSubLabel={newSubLabel[c.id] || ""}
                    onNewSubLabelChange={(v) => setNewSubLabel((p) => ({ ...p, [c.id]: v }))}
                    onAddSub={() => addSub(c.id)}
                    onDeleteSub={deleteSub}
                    onUpdate={updateCategory}
                    onDelete={() => deleteCategory(c.id)}
                    onToggleTipo={(t2) => toggleCategoryTipo(c, t2)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {categories.some((c) => (c.tipo_scope || []).length === 0) && (
          <div className="mb-4">
            <h3 className="mb-1.5 text-[12px] font-semibold text-piedra">Sin tipo asignado</h3>
            <div className="flex flex-col gap-2">
              {categories
                .filter((c) => (c.tipo_scope || []).length === 0)
                .map((c) => (
                  <CategoryCard
                    key={c.id}
                    c={c}
                    subs={subs.filter((s) => s.category_id === c.id)}
                    newSubLabel={newSubLabel[c.id] || ""}
                    onNewSubLabelChange={(v) => setNewSubLabel((p) => ({ ...p, [c.id]: v }))}
                    onAddSub={() => addSub(c.id)}
                    onDeleteSub={deleteSub}
                    onUpdate={updateCategory}
                    onDelete={() => deleteCategory(c.id)}
                    onToggleTipo={(t2) => toggleCategoryTipo(c, t2)}
                  />
                ))}
            </div>
          </div>
        )}
        <div className="mt-3 rounded-lg border border-dashed border-piedra/70 p-3">
          <p className="mb-2 text-[11px] text-tinta-suave">
            Solo hace falta el nombre, un ícono y al menos un tipo — el identificador interno se genera solo a partir del
            nombre.
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <input
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              placeholder="Nombre (ej: Mascotas)"
              className="flex-1 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            />
            <i className={`ti ${newCatIcon || "ti-help"} text-lg text-oliva`} aria-hidden />
            <input
              list="icon-suggestions"
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              placeholder="ti-paw"
              className="w-36 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            />
            <datalist id="icon-suggestions">
              {ICON_SUGGESTIONS.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TIPO_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  setNewCatTipos((prev) => (prev.includes(t.value) ? prev.filter((x) => x !== t.value) : [...prev, t.value]))
                }
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  newCatTipos.includes(t.value) ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={addCategory} className="rounded-lg bg-oliva px-3 py-1.5 text-xs font-semibold text-hueso">
            Agregar categoría
          </button>
          <p className="mt-1.5 text-[11px] text-tinta-suave">
            Elegí un ícono de la lista o mirá los nombres disponibles en{" "}
            <a href="https://tabler.io/icons" target="_blank" rel="noreferrer" className="text-golfo underline">
              tabler.io/icons
            </a>
            .
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">Zonas</h2>
        <div className="flex flex-col gap-1.5">
          {zones.map((z, i) => (
            <div key={z.id} className="flex items-center gap-1.5 rounded-lg bg-hueso-2 px-2.5 py-1.5 text-[12px] text-tinta">
              <span className="flex-1">{z.label}</span>
              <button onClick={() => moveZone(i, -1)} disabled={i === 0} aria-label="Subir" className="disabled:opacity-30">
                <i className="ti ti-arrow-up text-[13px]" aria-hidden />
              </button>
              <button onClick={() => moveZone(i, 1)} disabled={i === zones.length - 1} aria-label="Bajar" className="disabled:opacity-30">
                <i className="ti ti-arrow-down text-[13px]" aria-hidden />
              </button>
              <button onClick={() => deleteZone(z.id)} aria-label="Quitar zona">
                <i className="ti ti-x text-[13px]" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          <input
            value={newZoneLabel}
            onChange={(e) => setNewZoneLabel(e.target.value)}
            placeholder="Nueva zona"
            className="flex-1 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
          />
          <button onClick={addZone} className="rounded-lg border border-oliva px-2.5 py-1.5 text-xs text-oliva">
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  c,
  subs,
  newSubLabel,
  onNewSubLabelChange,
  onAddSub,
  onDeleteSub,
  onUpdate,
  onDelete,
  onToggleTipo,
}: {
  c: CategoryRow;
  subs: SubcategoryRow[];
  newSubLabel: string;
  onNewSubLabelChange: (v: string) => void;
  onAddSub: () => void;
  onDeleteSub: (id: string) => void;
  onUpdate: (id: string, patch: { label?: string; icon?: string }) => void;
  onDelete: () => void;
  onToggleTipo: (t: TipoPublicacion) => void;
}) {
  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <i className={`ti ${c.icon} text-oliva`} aria-hidden />
        <input
          defaultValue={c.label}
          onBlur={(e) => e.target.value.trim() !== c.label && onUpdate(c.id, { label: e.target.value.trim() })}
          className="flex-1 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
        />
        <input
          defaultValue={c.icon}
          onBlur={(e) => e.target.value.trim() !== c.icon && onUpdate(c.id, { icon: e.target.value.trim() })}
          placeholder="ti-icono"
          className="w-32 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
        />
        <button onClick={onDelete} className="rounded-lg border border-red-700 px-2 py-1.5 text-xs text-red-700">
          Eliminar
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TIPO_OPTIONS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onToggleTipo(t.value)}
            className={`rounded-full border px-2 py-0.5 text-[10.5px] ${
              (c.tipo_scope || []).includes(t.value) ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta-suave"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {subs.map((s) => (
          <span key={s.id} className="flex items-center gap-1 rounded-full bg-hueso-2 px-2.5 py-1 text-[11px] text-tinta">
            {s.label}
            <button onClick={() => onDeleteSub(s.id)} aria-label="Quitar subcategoría">
              <i className="ti ti-x text-[10px]" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          value={newSubLabel}
          onChange={(e) => onNewSubLabelChange(e.target.value)}
          placeholder="Nueva subcategoría"
          className="flex-1 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
        />
        <button onClick={onAddSub} className="rounded-lg border border-oliva px-2.5 py-1.5 text-xs text-oliva">
          Agregar
        </button>
      </div>
    </div>
  );
}

// ---------- Publicaciones ----------

function AdminListingRow({
  listing: l,
  expanded,
  onToggle,
  onSaved,
  users,
  isSuperadmin,
}: {
  listing: ListingWithPublisher;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
  users: ProfileRow[];
  isSuperadmin: boolean;
}) {
  const { categories } = useCategories();
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState("");
  const [historial, setHistorial] = useState<ModeracionLogRow[]>([]);
  const [reassignTo, setReassignTo] = useState("");
  const [form, setForm] = useState({
    nombre: l.nombre,
    subtitulo: l.subtitulo || "",
    descripcion: l.descripcion,
    categoria: l.categoria || "",
    subcategoria: l.subcategoria || "",
    precio: l.precio ? String(l.precio) : "",
    precioConsultar: l.precio_a_consultar,
    precioRegalo: l.precio_regalo,
    zona: l.zona,
    cuadrante: l.cuadrante || "",
    direccion: l.direccion || "",
    tags: l.tags.join(", "),
    whatsappPublico: l.whatsapp_publico,
  });

  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [fotoCropQueue, setFotoCropQueue] = useState<File[]>([]);
  const [portadaCropFile, setPortadaCropFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<{ id: string; pregunta: string; respuesta: string | null; estado: string }[]>([]);
  const [mensajes, setMensajes] = useState<{ id: string; es_staff: boolean; mensaje: string; created_at: string }[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function onClickOutside(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) onToggle();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [expanded, onToggle]);

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

  const loadImages = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("listing_images").select("id, url").eq("listing_id", l.id).order("orden");
    setImages(data || []);
  }, [l.id]);

  const loadQuestions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listing_questions")
      .select("id, pregunta, respuesta, estado")
      .eq("listing_id", l.id)
      .order("created_at", { ascending: false });
    setQuestions(data || []);
  }, [l.id]);

  async function toggleQuestionEstado(questionId: string, estadoActual: string) {
    const supabase = createClient();
    const nuevoEstado = estadoActual === "visible" ? "oculta" : "visible";
    const { error } = await supabase.rpc("admin_set_question_status", { p_question_id: questionId, p_estado: nuevoEstado });
    if (error) alert(error.message);
    else loadQuestions();
  }

  const loadMensajes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("mensajes_moderacion")
      .select("id, es_staff, mensaje, created_at")
      .eq("listing_id", l.id)
      .order("created_at", { ascending: true });
    setMensajes(data || []);
  }, [l.id]);

  async function enviarMensaje() {
    if (!nuevoMensaje.trim()) return;
    setEnviandoMensaje(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("enviar_mensaje_moderacion", { p_listing_id: l.id, p_mensaje: nuevoMensaje.trim() });
    setEnviandoMensaje(false);
    if (error) {
      alert(error.message);
      return;
    }
    setNuevoMensaje("");
    loadMensajes();
  }

  useEffect(() => {
    if (expanded) {
      loadHistorial();
      loadImages();
      loadQuestions();
      loadMensajes();
    }
  }, [expanded, loadHistorial, loadImages, loadQuestions, loadMensajes]);

  function agregarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setFotoCropQueue((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  async function handleFotoCropConfirm(blob: Blob) {
    setSaving(true);
    const supabase = createClient();
    const resized = await resizeImage(blob);
    const orden = images.length;
    const path = `admin/${l.id}/${Date.now()}-${orden}.jpg`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, resized, { contentType: "image/jpeg" });
    if (uploadError) {
      alert(uploadError.message);
    } else {
      const url = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
      await supabase.from("listing_images").insert({ listing_id: l.id, url, orden });
    }
    setSaving(false);
    setFotoCropQueue((prev) => prev.slice(1));
    loadImages();
  }

  function handleFotoCropCancel() {
    setFotoCropQueue((prev) => prev.slice(1));
  }

  async function quitarFoto(imageId: string) {
    const supabase = createClient();
    await supabase.from("listing_images").delete().eq("id", imageId);
    loadImages();
  }

  async function reasignar() {
    if (!reassignTo) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_reassign_listing", { p_listing_id: l.id, p_new_publisher_id: reassignTo });
    setSaving(false);
    if (error) alert(error.message);
    else {
      setReassignTo("");
      onSaved();
    }
  }

  async function guardarCambios() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_update_listing", {
      p_listing_id: l.id,
      p_nombre: form.nombre,
      p_subtitulo: form.subtitulo || null,
      p_descripcion: maskPhoneNumbers(form.descripcion).masked,
      p_categoria: form.categoria || null,
      p_subcategoria: form.subcategoria || null,
      p_precio: form.precio ? Number(form.precio) : null,
      p_precio_a_consultar: form.precioConsultar,
      p_precio_regalo: form.precioRegalo,
      p_zona: form.zona,
      p_cuadrante: form.cuadrante || null,
      p_direccion: form.direccion || null,
      p_tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      p_whatsapp_publico: form.whatsappPublico,
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

  async function eliminarPermanente() {
    if (!confirm(`¿Eliminar definitivamente "${l.nombre}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_delete_listing", { p_listing_id: l.id });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
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

  async function toggleEmprendimientoDestacado() {
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_emprendimiento_destacado", {
      p_listing_id: l.id,
      p_value: !l.emprendimiento_destacado,
    });
    if (error) alert(error.message);
    else onSaved();
  }

  async function convertirEnAnuncio() {
    if (
      !confirm(
        `¿Crear un anuncio a partir de "${l.nombre}"? Se copia nombre, descripción y foto. Después lo terminás de armar (layout, fecha, imagen de fondo) desde la pestaña Anuncios antes de publicarlo.`
      )
    )
      return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_convertir_listing_en_anuncio", {
      p_listing_id: l.id,
      p_cta_url: `${SITE_URL}/publicacion/${l.id}`,
      p_cta_label: "Ver publicación",
    });
    setSaving(false);
    if (error) alert(error.message);
    else alert('Anuncio creado como borrador (estado "Aprobado"). Buscalo en la pestaña Anuncios para completarlo y publicarlo.');
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

  function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortadaCropFile(file);
    e.target.value = "";
  }

  async function handlePortadaCropConfirm(blob: Blob) {
    setPortadaCropFile(null);
    setSaving(true);
    const supabase = createClient();
    const resized = await resizeImage(blob);
    let fotoUrl: string;
    let fotoOgUrl: string | null;
    try {
      ({ fotoUrl, fotoOgUrl } = await uploadCoverPhoto(supabase, resized, `admin/${l.id}`));
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo subir la foto.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.rpc("admin_update_listing", {
      p_listing_id: l.id,
      p_foto_url: fotoUrl,
      ...(fotoOgUrl ? { p_foto_og_url: fotoOgUrl } : {}),
    });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
  }

  const link = contactUrl(l.profiles?.whatsapp_number, l.profiles?.email);

  return (
    <div ref={rowRef} className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">
            {l.nombre} {l.destacada && <i className="ti ti-star text-dorado" aria-hidden />} {l.sello && <i className="ti ti-award text-oliva" aria-hidden />}{" "}
            {l.emprendimiento_destacado && <i className="ti ti-building-store text-golfo" aria-hidden />}
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
              <i className="ti ti-award" aria-hidden /> Selección Origen
            </button>
            {l.tipo === "emprendimiento" && (
              <button
                onClick={toggleEmprendimientoDestacado}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  l.emprendimiento_destacado ? "border-golfo bg-golfo text-hueso" : "border-piedra/70 text-tinta"
                }`}
              >
                <i className="ti ti-building-store" aria-hidden /> Emprendimiento destacado
              </button>
            )}
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-golfo px-2.5 py-1.5 text-xs text-golfo">
                <i className="ti ti-brand-whatsapp" aria-hidden /> Contactar publicador
              </a>
            )}
            <button disabled={saving} onClick={convertirEnAnuncio} className="rounded-lg border border-dorado px-2.5 py-1.5 text-xs text-dorado">
              <i className="ti ti-speakerphone" aria-hidden /> Convertir en anuncio
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LabeledInput label="Título" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
            <LabeledInput label="Subtítulo" value={form.subtitulo} onChange={(v) => setForm({ ...form, subtitulo: v })} />
            <LabeledInput label="Barrio" value={form.zona} onChange={(v) => setForm({ ...form, zona: v })} />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              >
                <option value="">(sin categoría)</option>
                {Object.entries(categories)
                  .filter(([, c]) => !l.tipo || c.tipoScope.includes(l.tipo as TipoPublicacion))
                  .map(([key, c]) => (
                    <option key={key} value={key}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </div>
            <LabeledInput label="Subcategoría" value={form.subcategoria} onChange={(v) => setForm({ ...form, subcategoria: v })} />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">Precio</label>
              <input
                type="number"
                disabled={form.precioConsultar || form.precioRegalo}
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta disabled:bg-hueso-2"
              />
            </div>
            <div className="flex items-center gap-3 pb-1.5 text-[11px] text-tinta sm:col-span-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="precioModoAdmin"
                  checked={!form.precioConsultar && !form.precioRegalo}
                  onChange={() => setForm({ ...form, precioConsultar: false, precioRegalo: false })}
                />
                Precio fijo
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="precioModoAdmin"
                  checked={form.precioConsultar}
                  onChange={() => setForm({ ...form, precioConsultar: true, precioRegalo: false })}
                />
                Precio a consultar
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="precioModoAdmin"
                  checked={form.precioRegalo}
                  onChange={() => setForm({ ...form, precioRegalo: true, precioConsultar: false, precio: "" })}
                />
                Se regala
              </label>
            </div>
            <LabeledInput label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="min-h-[60px] w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            />
            {containsPhoneNumber(form.descripcion) && (
              <p className="mt-1 text-[11px] text-dorado">
                Parece que hay un teléfono en la descripción — al guardar se va a ocultar automáticamente.
              </p>
            )}
          </div>
          <LabeledInput label="Palabras clave (separadas por coma)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />

          <label className="flex items-center gap-1.5 text-[11.5px] text-tinta">
            <input
              type="checkbox"
              checked={form.whatsappPublico}
              onChange={(e) => setForm({ ...form, whatsappPublico: e.target.checked })}
            />
            WhatsApp público (sin login)
          </label>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Foto de portada (cargar/reemplazar en nombre del vecino)</label>
            {l.foto_url && (
              <div className="relative mb-1.5 h-16 w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.foto_url} alt="Foto de portada actual" className="h-full w-full rounded object-cover" />
                <button
                  type="button"
                  onClick={() => downloadImage(l.foto_url!, `portada-${l.id}.jpg`)}
                  aria-label="Descargar foto de portada"
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <i className="ti ti-download text-[9px]" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setPortadaCropFile(await urlToFile(l.foto_url!, "portada.jpg"));
                    } catch {
                      alert("No se pudo cargar la foto para editar.");
                    }
                  }}
                  aria-label="Editar recorte de la foto de portada"
                  className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <i className="ti ti-crop text-[9px]" aria-hidden />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={subirFoto} className="text-xs" />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Fotos adicionales</label>
            <div className="flex flex-wrap gap-2">
              {images.map((im) => (
                <div key={im.id} className="relative h-16 w-16 overflow-hidden rounded-md border border-piedra/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="Foto" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => downloadImage(im.url, `foto-${im.id}.jpg`)}
                    aria-label="Descargar foto"
                    className="absolute bottom-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <i className="ti ti-download text-[9px]" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarFoto(im.id)}
                    aria-label="Quitar foto"
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <i className="ti ti-x text-[9px]" aria-hidden />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-[1.5px] border-dashed border-piedra/70 text-oliva">
                <i className="ti ti-plus text-lg" aria-hidden />
                <input type="file" accept="image/*" multiple onChange={agregarFotos} className="hidden" />
              </label>
            </div>
          </div>

          <button onClick={guardarCambios} disabled={saving} className="w-fit rounded-lg bg-oliva px-4 py-2 text-xs font-semibold text-hueso disabled:bg-piedra">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {isSuperadmin && (
            <div className="border-t border-piedra/40 pt-3">
              <label className="mb-1 block text-[11px] font-medium text-tinta">Reasignar a otro usuario</label>
              <div className="flex gap-2">
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="flex-1 rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
                >
                  <option value="">Elegí un usuario</option>
                  {users
                    .filter((u) => u.id !== l.publisher_id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email || u.id}
                      </option>
                    ))}
                </select>
                <button
                  onClick={reasignar}
                  disabled={saving || !reassignTo}
                  className="rounded-lg border border-piedra/70 px-3 py-1.5 text-xs text-tinta disabled:opacity-60"
                >
                  Reasignar
                </button>
              </div>
              <button
                onClick={eliminarPermanente}
                disabled={saving}
                className="mt-2 w-fit rounded-lg border border-red-700 bg-red-700 px-3 py-1.5 text-xs font-semibold text-hueso disabled:opacity-60"
              >
                Eliminar publicación definitivamente
              </button>
            </div>
          )}

          {questions.length > 0 && (
            <div className="border-t border-piedra/40 pt-3">
              <label className="mb-1.5 block text-[11px] font-medium text-tinta">Preguntas</label>
              <div className="flex flex-col gap-1.5">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-start justify-between gap-2 rounded-lg bg-hueso-2 p-2.5">
                    <div className="text-[11.5px] text-tinta">
                      <p className="font-medium">{q.pregunta}</p>
                      <p className="text-tinta-suave">{q.respuesta || "Sin responder"}</p>
                    </div>
                    <button
                      onClick={() => toggleQuestionEstado(q.id, q.estado)}
                      className={`flex-shrink-0 rounded-lg border px-2 py-1 text-[10.5px] ${
                        q.estado === "visible" ? "border-piedra/70 text-tinta" : "border-red-700 text-red-700"
                      }`}
                    >
                      {q.estado === "visible" ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-piedra/40 pt-3">
            <label className="mb-1.5 block text-[11px] font-medium text-tinta">Mensaje al publicador (el vecino lo ve)</label>
            {mensajes.length > 0 && (
              <div className="mb-2 flex flex-col gap-1.5">
                {mensajes.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg p-2.5 text-[11.5px] ${
                      m.es_staff ? "self-end bg-oliva text-hueso" : "self-start bg-hueso-2 text-tinta"
                    }`}
                  >
                    <p>{m.mensaje}</p>
                    <p className={`mt-0.5 text-[10px] ${m.es_staff ? "text-hueso/70" : "text-tinta-suave"}`}>
                      {m.es_staff ? "Vos (staff)" : "Vecino"} · {new Date(m.created_at).toLocaleString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Ej: subí una foto más clara del producto"
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              />
              <button
                onClick={enviarMensaje}
                disabled={enviandoMensaje}
                className="flex-shrink-0 rounded-lg bg-oliva px-3 py-1.5 text-xs font-semibold text-hueso disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
          </div>

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
      {fotoCropQueue.length > 0 && <PhotoCropModal file={fotoCropQueue[0]} onConfirm={handleFotoCropConfirm} onCancel={handleFotoCropCancel} />}
      {portadaCropFile && (
        <PhotoCropModal
          file={portadaCropFile}
          aspect={4 / 5}
          previewPanels={LISTING_COVER_PREVIEW_PANELS}
          onConfirm={handlePortadaCropConfirm}
          onCancel={() => setPortadaCropFile(null)}
        />
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
  isSuperadmin,
}: {
  anuncio: AnuncioWithSolicitante;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
  isSuperadmin: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const [uploadingFondo, setUploadingFondo] = useState(false);
  const [imagenCropFile, setImagenCropFile] = useState<File | null>(null);
  const [nota, setNota] = useState("");
  const [historial, setHistorial] = useState<ModeracionLogRow[]>([]);
  const [form, setForm] = useState({
    tipo: a.tipo,
    titulo: a.titulo,
    descripcion: a.descripcion,
    lugar: a.lugar || "",
    orden: String(a.orden),
    ubicacion: a.ubicacion,
    layoutType: a.layout_type,
    imageOrientation: a.image_orientation || "",
    ctaLabel: a.cta_label || "",
    ctaUrl: a.cta_url || "",
    whatsappNumero: a.whatsapp_numero || "",
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
      p_tipo: form.tipo,
      p_titulo: form.titulo,
      p_descripcion: form.descripcion,
      p_lugar: form.lugar || null,
      p_orden: form.orden ? Number(form.orden) : null,
      p_ubicacion: form.ubicacion,
      p_layout_type: form.layoutType,
      p_image_orientation: form.imageOrientation || null,
      p_cta_label: form.ctaLabel || null,
      p_cta_url: form.ctaUrl || null,
      p_whatsapp_numero: form.whatsappNumero || null,
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      onSaved();
      loadHistorial();
    }
  }

  function handleUploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenCropFile(file);
    e.target.value = "";
  }

  async function handleImagenCropConfirm(blob: Blob) {
    setImagenCropFile(null);
    setUploadingImagen(true);
    const croppedFile = new File([blob], "flyer.jpg", { type: "image/jpeg" });
    const orientation = await detectImageOrientation(croppedFile);
    const resized = await resizeImage(croppedFile);
    const supabase = createClient();
    const path = `anuncios/${a.id}/${Date.now()}-flyer.jpg`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, resized, { contentType: "image/jpeg" });
    if (uploadError) {
      alert(uploadError.message);
      setUploadingImagen(false);
      return;
    }
    const url = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.rpc("admin_process_anuncio", {
      p_anuncio_id: a.id,
      p_imagen_url: url,
      p_image_orientation: orientation,
    });
    setUploadingImagen(false);
    if (error) {
      alert(error.message);
      return;
    }
    setForm((f) => ({ ...f, imageOrientation: orientation }));
    onSaved();
  }

  async function handleUploadFondo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFondo(true);
    const resized = await resizeImage(file);
    const supabase = createClient();
    const path = `anuncios/${a.id}/${Date.now()}-fondo.jpg`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, resized, { contentType: "image/jpeg" });
    if (uploadError) {
      alert(uploadError.message);
      setUploadingFondo(false);
      e.target.value = "";
      return;
    }
    const url = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.rpc("admin_process_anuncio", { p_anuncio_id: a.id, p_background_image_url: url });
    setUploadingFondo(false);
    e.target.value = "";
    if (error) alert(error.message);
    else onSaved();
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

  async function eliminarPermanente() {
    if (!confirm(`¿Eliminar definitivamente el anuncio "${a.titulo}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_delete_anuncio", { p_anuncio_id: a.id });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
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

  const previewAnuncio: Anuncio = {
    id: a.id,
    tipo: form.tipo,
    titulo: form.titulo,
    descripcion: form.descripcion,
    imagen: a.imagen_url || undefined,
    fechaEvento: a.fecha_evento || undefined,
    lugar: form.lugar || undefined,
    orden: a.orden,
    ubicacion: form.ubicacion,
    layoutType: form.layoutType as AnuncioLayoutType,
    imageOrientation: (form.imageOrientation || undefined) as ImageOrientation | undefined,
    backgroundImagen: a.background_image_url || undefined,
    ctaLabel: form.ctaLabel || undefined,
    ctaUrl: form.ctaUrl || undefined,
    whatsappNumero: form.whatsappNumero || undefined,
  };

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

          {isSuperadmin && (
            <button
              onClick={eliminarPermanente}
              disabled={saving}
              className="w-fit rounded-lg border border-red-700 bg-red-700 px-3 py-1.5 text-xs font-semibold text-hueso disabled:opacity-60"
            >
              Eliminar anuncio definitivamente
            </button>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoAnuncio })}
              className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            >
              {(Object.keys(TIPO_LABEL) as TipoAnuncio[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
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
            <LabeledInput label="Lugar (texto o link de Maps)" value={form.lugar} onChange={(v) => setForm({ ...form, lugar: v })} />
            <LabeledInput label="Orden en el carrusel" type="number" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-tinta">Dónde se muestra</label>
            <select
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value as "home" | "categoria" | "ambas" })}
              className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
            >
              <option value="home">Solo en el inicio</option>
              <option value="categoria">Solo en categorías/resultados</option>
              <option value="ambas">En ambas</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">Layout</label>
              <select
                value={form.layoutType}
                onChange={(e) => setForm({ ...form, layoutType: e.target.value as typeof form.layoutType })}
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              >
                {ANUNCIO_LAYOUT_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {ANUNCIO_LAYOUT_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">Orientación de la imagen</label>
              <select
                value={form.imageOrientation}
                onChange={(e) => setForm({ ...form, imageOrientation: e.target.value })}
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              >
                <option value="">Sin especificar</option>
                {Object.entries(IMAGE_ORIENTATION_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">
                Flyer / imagen principal {uploadingImagen && "(subiendo...)"}
              </label>
              {a.imagen_url && (
                <div className="relative mb-1.5 h-16 w-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imagen_url} alt="" className="h-full w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setImagenCropFile(await urlToFile(a.imagen_url!, "flyer.jpg"));
                      } catch {
                        alert("No se pudo cargar la imagen para editar.");
                      }
                    }}
                    aria-label="Editar recorte del flyer"
                    className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <i className="ti ti-crop text-[9px]" aria-hidden />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImagen}
                onChange={handleUploadImagen}
                className="w-full text-[11px] text-tinta"
              />
              {form.layoutType === "flyer_on_sign" && (
                <p className="mt-1 text-[10.5px] text-tinta-suave">El recorte se ajusta a la proporción del panel del cartel.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-tinta">
                Imagen de fondo (opcional) {uploadingFondo && "(subiendo...)"}
              </label>
              {a.background_image_url && <img src={a.background_image_url} alt="" className="mb-1.5 h-16 w-16 rounded object-cover" />}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingFondo}
                onChange={handleUploadFondo}
                className="w-full text-[11px] text-tinta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="Texto del botón (CTA)" value={form.ctaLabel} onChange={(v) => setForm({ ...form, ctaLabel: v })} />
            <LabeledInput label="Link del botón" value={form.ctaUrl} onChange={(v) => setForm({ ...form, ctaUrl: v })} />
          </div>
          <LabeledInput
            label="WhatsApp de contacto (opcional, solo números con código de área)"
            value={form.whatsappNumero}
            onChange={(v) => setForm({ ...form, whatsappNumero: v })}
          />

          <button onClick={guardarCambios} disabled={saving} className="w-fit rounded-lg bg-oliva px-4 py-2 text-xs font-semibold text-hueso disabled:bg-piedra">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <div>
            <p className="mb-1.5 text-[11px] font-medium text-tinta">Vista previa en los 4 formatos</p>
            <div className="flex flex-wrap gap-3">
              {ANUNCIO_LAYOUT_OPTIONS.map((t) => (
                <div key={t} className="w-[220px]">
                  <p className="mb-1 text-[10.5px] text-tinta-suave">{ANUNCIO_LAYOUT_LABELS[t]}</p>
                  <div className="overflow-hidden rounded-xl border border-piedra/50">
                    <AnuncioSlide anuncio={{ ...previewAnuncio, layoutType: t as AnuncioLayoutType }} priority={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

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
      {imagenCropFile && (
        <PhotoCropModal
          file={imagenCropFile}
          aspect={form.layoutType === "flyer_on_sign" ? CARTEL_FLYER_ASPECT : undefined}
          previewPanels={[
            {
              label: "Así se ve",
              render: (url) => (
                <div className="w-[220px]">
                  <AnuncioSlide anuncio={{ ...previewAnuncio, imagen: url }} priority={false} />
                </div>
              ),
            },
          ]}
          onConfirm={handleImagenCropConfirm}
          onCancel={() => setImagenCropFile(null)}
        />
      )}
    </div>
  );
}

// ---------- Denuncias ----------

function AdminReportRow({
  report: r,
  expanded,
  onToggle,
  onSaved,
  isSuperadmin,
}: {
  report: ReportWithDetails;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
  isSuperadmin: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState("");
  const [historial, setHistorial] = useState<ModeracionLogRow[]>([]);

  async function suspenderAmbos() {
    if (!r.listings) return;
    if (!confirm("¿Suspender la cuenta del denunciante y del denunciado? Quedan bloqueados hasta que un superadmin los desbloquee.")) return;
    setSaving(true);
    const supabase = createClient();
    const { error: errorDenunciado } = await supabase.rpc("admin_set_blocked", {
      p_user_id: r.listings.publisher_id,
      p_blocked: true,
    });
    let errorDenunciante = null;
    if (r.reporter_id) {
      const res = await supabase.rpc("admin_set_blocked", { p_user_id: r.reporter_id, p_blocked: true });
      errorDenunciante = res.error;
    }
    setSaving(false);
    if (errorDenunciado) {
      alert(errorDenunciado.message);
      return;
    }
    if (!r.reporter_id) alert("El denunciado quedó suspendido. La cuenta del denunciante ya no existe, no hay nada que suspender.");
    else if (errorDenunciante) alert(errorDenunciante.message);
    onSaved();
  }

  const loadHistorial = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("moderacion_log")
      .select("*")
      .eq("entity_type", "denuncia")
      .eq("entity_id", r.id)
      .order("created_at", { ascending: false });
    setHistorial(data || []);
  }, [r.id]);

  useEffect(() => {
    if (expanded) loadHistorial();
  }, [expanded, loadHistorial]);

  async function cambiarEstado(estado: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_report_status", { p_report_id: r.id, p_estado: estado });
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
    const { error } = await supabase.rpc("admin_add_nota", { p_entity_type: "denuncia", p_entity_id: r.id, p_nota: nota });
    if (error) alert(error.message);
    else {
      setNota("");
      loadHistorial();
    }
  }

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">{REPORT_MOTIVO_LABELS[r.motivo] ?? r.motivo}</p>
          <p className="text-xs text-tinta-suave">
            Publicación: {r.listings?.nombre ?? "(eliminada)"} · Denunciante: {r.profiles?.full_name || r.profiles?.email || "?"}
          </p>
          <p className="text-xs text-tinta-suave">{new Date(r.created_at).toLocaleString("es-AR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">{REPORT_STATUS_LABELS[r.estado]}</span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Revisar"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <p className="text-xs text-tinta">
            <span className="font-medium">Justificación:</span> {r.justificacion}
          </p>
          {r.evidencia_url && (
            <a href={r.evidencia_url} target="_blank" rel="noreferrer" className="text-xs text-golfo">
              Ver evidencia
            </a>
          )}

          {r.respuesta_denunciado ? (
            <p className="text-xs text-tinta">
              <span className="font-medium">Respuesta del denunciado:</span> {r.respuesta_denunciado}
            </p>
          ) : (
            <p className="text-xs text-tinta-suave">El denunciado todavía no respondió.</p>
          )}

          {requiereSuspensionReciproca(r.motivo) && isSuperadmin && (
            <button
              onClick={suspenderAmbos}
              disabled={saving}
              className="w-fit rounded-lg border border-red-700 bg-red-700 px-3 py-1.5 text-xs font-semibold text-hueso disabled:opacity-60"
            >
              Suspender a ambos (denunciante y denunciado)
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            {REPORT_STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                disabled={saving}
                onClick={() => cambiarEstado(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${r.estado === s ? "border-oliva bg-oliva text-hueso" : "border-piedra/70 text-tinta"}`}
              >
                {REPORT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="border-t border-piedra/40 pt-3">
            <label className="mb-1 block text-[11px] font-medium text-tinta">Nota interna</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: contacté al publicador, aclaró el precio"
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

function AdminVerificationRow({
  verification: v,
  expanded,
  onToggle,
  onSaved,
}: {
  verification: VerificationWithUser;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState("");

  async function resolver(estado: "aprobada" | "rechazada") {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_verification_status", {
      p_request_id: v.id,
      p_estado: estado,
      p_nota: nota.trim() || null,
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      setNota("");
      onSaved();
    }
  }

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">{NIVEL_LABELS[v.nivel_solicitado] ?? `Nivel ${v.nivel_solicitado}`}</p>
          <p className="text-xs text-tinta-suave">{v.profiles?.full_name || v.profiles?.email || "?"}</p>
          <p className="text-xs text-tinta-suave">{new Date(v.created_at).toLocaleString("es-AR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">{REPORT_STATUS_LABELS[v.estado] ?? v.estado}</span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Revisar"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <p className="text-xs text-tinta">
            <span className="font-medium">Motivo:</span> {v.motivo}
          </p>
          {v.profiles?.whatsapp_number && <p className="text-xs text-tinta-suave">WhatsApp: {v.profiles.whatsapp_number}</p>}
          {v.evidencia_url && (
            <a href={v.evidencia_url} target="_blank" rel="noreferrer" className="text-xs text-golfo">
              Ver evidencia
            </a>
          )}

          {v.estado === "pendiente" ? (
            <>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Nota para el usuario (opcional)"
                className="w-full rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
              />
              <div className="flex gap-2">
                <button
                  disabled={saving}
                  onClick={() => resolver("aprobada")}
                  className="rounded-lg border border-oliva bg-oliva px-3 py-1.5 text-xs font-semibold text-hueso disabled:opacity-60"
                >
                  Aprobar
                </button>
                <button
                  disabled={saving}
                  onClick={() => resolver("rechazada")}
                  className="rounded-lg border border-red-700 px-3 py-1.5 text-xs text-red-700 disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-tinta-suave">
              Resuelta el {v.revisado_en ? new Date(v.revisado_en).toLocaleString("es-AR") : "?"}
              {v.nota_revision ? ` — ${v.nota_revision}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminReviewReportRow({
  report: r,
  expanded,
  onToggle,
  onSaved,
}: {
  report: ReviewReportWithDetails;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function cambiarEstado(estado: "resuelta" | "rechazada") {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_review_report_status", { p_report_id: r.id, p_estado: estado });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
  }

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">{REVIEW_MOTIVO_LABELS[r.motivo] ?? r.motivo}</p>
          <p className="text-xs text-tinta-suave">
            Reseña: {r.reviews ? `${r.reviews.rating}★ — ${r.reviews.estado}` : "(eliminada)"} · Reportante:{" "}
            {r.profiles?.full_name || r.profiles?.email || "?"}
          </p>
          <p className="text-xs text-tinta-suave">{new Date(r.created_at).toLocaleString("es-AR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">
            {REVIEW_REPORT_STATUS_LABELS[r.estado] ?? r.estado}
          </span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Revisar"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <p className="text-xs text-tinta">
            <span className="font-medium">Justificación:</span> {r.justificacion}
          </p>
          {r.reviews?.comentario && (
            <p className="text-xs text-tinta">
              <span className="font-medium">Comentario de la reseña:</span> {r.reviews.comentario}
            </p>
          )}

          {r.estado === "pendiente" ? (
            <div className="flex flex-wrap gap-2">
              {REVIEW_REPORT_STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={saving}
                  onClick={() => cambiarEstado(s as "resuelta" | "rechazada")}
                  className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta disabled:opacity-60"
                >
                  {REVIEW_REPORT_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-tinta-suave">Ya resuelto: {REVIEW_REPORT_STATUS_LABELS[r.estado]}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminSupportRequestRow({
  request: s,
  expanded,
  onToggle,
  onSaved,
}: {
  request: SupportRequestWithUser;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function marcarResuelta() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_support_request_status", { p_request_id: s.id, p_estado: "resuelta" });
    setSaving(false);
    if (error) alert(error.message);
    else onSaved();
  }

  return (
    <div className="rounded-lg border border-piedra/50 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="cursor-pointer" onClick={onToggle}>
          <p className="text-sm font-semibold text-tinta">{s.nombre}</p>
          {s.user_id && (
            <p className="text-xs font-medium text-golfo">
              <i className="ti ti-user-check" aria-hidden /> Usuario registrado: {s.profiles?.full_name || s.profiles?.email || s.user_id}
            </p>
          )}
          <p className="text-xs text-tinta-suave">{s.contacto}</p>
          <p className="text-xs text-tinta-suave">{new Date(s.created_at).toLocaleString("es-AR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-piedra/60 px-2 py-1 text-[11px] text-tinta">
            {s.estado === "resuelta" ? "Resuelta" : "Pendiente"}
          </span>
          <button onClick={onToggle} className="rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta">
            {expanded ? "Cerrar" : "Ver"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-piedra/40 pt-3">
          <p className="whitespace-pre-line text-xs text-tinta">{s.mensaje}</p>
          <div className="flex flex-wrap gap-2">
            {supportContactOptions(s).length > 0 ? (
              supportContactOptions(s).map((op) => (
                <a
                  key={op.label}
                  href={op.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit rounded-lg border border-golfo px-2.5 py-1.5 text-xs text-golfo"
                >
                  <i className="ti ti-external-link" aria-hidden /> {op.label}
                </a>
              ))
            ) : (
              <p className="text-xs text-red-700">
                No se pudo armar un link de contacto — lo único que dejó fue &quot;{s.contacto}&quot;, copialo a mano.
              </p>
            )}
            {s.estado === "pendiente" ? (
              <button
                disabled={saving}
                onClick={marcarResuelta}
                className="w-fit rounded-lg border border-piedra/70 px-2.5 py-1.5 text-xs text-tinta disabled:opacity-60"
              >
                Marcar como resuelta
              </button>
            ) : (
              <p className="text-xs text-tinta-suave">Resuelta el {s.resuelto_en ? new Date(s.resuelto_en).toLocaleString("es-AR") : "—"}</p>
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
