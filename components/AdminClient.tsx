"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListingRow, ProfileRow } from "@/lib/supabase/types";

type Tab = "publicaciones" | "usuarios";

const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicada: "Publicada",
  observada: "Observada",
  rechazada: "Rechazada",
  pausada: "Pausada",
  vencida: "Vencida",
  eliminada: "Eliminada",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const ROLE_OPTIONS = ["publicador", "moderador", "administrador", "superadmin"];

interface AdminClientProps {
  role: string;
}

export default function AdminClient({ role }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [listings, setListings] = useState<Array<ListingRow & { profiles: { full_name: string | null; email: string | null } | null }>>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const canManageUsers = role === "administrador" || role === "superadmin";

  const loadListings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    setListings((data as never as typeof listings) || []);
  }, []);

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }, []);

  useEffect(() => {
    Promise.all([loadListings(), loadUsers()]).finally(() => setLoading(false));
  }, [loadListings, loadUsers]);

  async function changeStatus(listingId: string, status: string) {
    setSavingId(listingId);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_update_listing_status", { p_listing_id: listingId, p_status: status });
    if (error) alert(error.message);
    else await loadListings();
    setSavingId(null);
  }

  async function changeRole(userId: string, newRole: string) {
    setSavingId(userId);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: newRole });
    if (error) alert(error.message);
    else await loadUsers();
    setSavingId(null);
  }

  const pending = listings.filter((l) => l.status === "en_revision");
  const rest = listings.filter((l) => l.status !== "en_revision");

  return (
    <div className="min-h-screen bg-hueso px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 font-slab text-2xl font-semibold text-tinta">Panel de administración</h1>
        <p className="mb-6 text-sm text-tinta-suave">Rol actual: {role}</p>

        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setTab("publicaciones")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "publicaciones" ? "bg-oliva text-hueso" : "border border-piedra/70 text-tinta"}`}
          >
            Publicaciones
          </button>
          {canManageUsers && (
            <button
              onClick={() => setTab("usuarios")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "usuarios" ? "bg-oliva text-hueso" : "border border-piedra/70 text-tinta"}`}
            >
              Usuarios
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-tinta-suave">Cargando...</p>
        ) : tab === "publicaciones" ? (
          <div className="flex flex-col gap-6">
            {pending.length > 0 && (
              <div>
                <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-dorado">
                  Pendientes de revisión ({pending.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {pending.map((l) => (
                    <ListingRowCard key={l.id} listing={l} onChangeStatus={changeStatus} saving={savingId === l.id} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-2 font-slab text-sm font-semibold uppercase tracking-wide text-piedra">
                Todas las publicaciones ({rest.length})
              </h2>
              <div className="flex flex-col gap-2">
                {rest.map((l) => (
                  <ListingRowCard key={l.id} listing={l} onChangeStatus={changeStatus} saving={savingId === l.id} />
                ))}
              </div>
            </div>
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
                  disabled={savingId === u.id}
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

function ListingRowCard({
  listing: l,
  onChangeStatus,
  saving,
}: {
  listing: ListingRow & { profiles: { full_name: string | null; email: string | null } | null };
  onChangeStatus: (id: string, status: string) => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-piedra/50 bg-white p-3">
      <div>
        <p className="text-sm font-semibold text-tinta">{l.nombre}</p>
        <p className="text-xs text-tinta-suave">
          {l.tipo_aviso} · {l.categoria} / {l.subcategoria} · {l.zona}
        </p>
        <p className="text-xs text-tinta-suave">
          {l.profiles?.full_name || "?"} ({l.profiles?.email || "sin email"})
        </p>
      </div>
      <select
        value={l.status}
        disabled={saving}
        onChange={(e) => onChangeStatus(l.id, e.target.value)}
        className="rounded-lg border border-piedra/70 px-2 py-1.5 text-xs text-tinta"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
