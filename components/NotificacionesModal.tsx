"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/useCategories";

interface DisplayItem {
  id: string;
  tipo: string;
  listing_id: string | null;
  mensaje: string;
  leida: boolean;
  created_at: string | null;
}

interface NotificacionesModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onRead?: () => void;
}

const TIPO_ICON: Record<string, string> = {
  contacto: "ti-brand-whatsapp",
  pregunta_nueva: "ti-help-circle",
  pregunta_respondida: "ti-message-circle",
  aprobada: "ti-circle-check",
  observada: "ti-alert-triangle",
  vence_pronto: "ti-clock",
  mensaje_moderacion: "ti-messages",
  alerta_categoria: "ti-bell-ringing",
};

const DIAS_VENCE_PRONTO = 5;

export default function NotificacionesModal({ open, onClose, user, onRead }: NotificacionesModalProps) {
  const { categories } = useCategories();
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: notifs }, { data: listings }, { data: alertasData }] = await Promise.all([
      supabase
        .from("notificaciones")
        .select("id, tipo, listing_id, mensaje, leida, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("listings")
        .select("id, nombre, expires_at")
        .eq("publisher_id", user.id)
        .eq("status", "activa")
        .not("expires_at", "is", null),
      supabase.from("alertas_categoria").select("categoria").eq("user_id", user.id),
    ]);
    setAlertas((alertasData || []).map((a) => a.categoria));

    const venceProntos: DisplayItem[] = (listings || [])
      .filter((l) => {
        if (!l.expires_at) return false;
        const dias = (new Date(l.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return dias >= 0 && dias <= DIAS_VENCE_PRONTO;
      })
      .map((l) => ({
        id: `vence-${l.id}`,
        tipo: "vence_pronto",
        listing_id: l.id,
        mensaje: `Tu publicación "${l.nombre}" vence pronto — renovala si seguís interesado.`,
        leida: true,
        created_at: null,
      }));

    setItems([...venceProntos, ...((notifs as DisplayItem[]) || [])]);
    setLoading(false);

    if ((notifs || []).some((n) => !n.leida)) {
      await supabase.rpc("marcar_notificaciones_leidas");
      onRead?.();
    }
  }, [user.id, onRead]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function quitarAlerta(categoriaId: string) {
    const supabase = createClient();
    await supabase.from("alertas_categoria").delete().eq("user_id", user.id).eq("categoria", categoriaId);
    setAlertas((prev) => prev.filter((c) => c !== categoriaId));
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Notificaciones</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {!loading && alertas.length > 0 && (
            <div className="mb-4 border-b border-piedra/40 pb-4">
              <p className="mb-2 text-[12px] font-semibold text-tinta">Tus alertas de categoría</p>
              <div className="flex flex-wrap gap-1.5">
                {alertas.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1 rounded-full border border-dorado bg-dorado/10 px-2.5 py-1 text-[11px] text-nogal"
                  >
                    {categories[c]?.label || c}
                    <button onClick={() => quitarAlerta(c)} aria-label={`Sacar alerta de ${categories[c]?.label || c}`}>
                      <i className="ti ti-x text-[11px]" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">Todavía no tenés notificaciones.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((n) => {
                const content = (
                  <div className={`flex items-start gap-2.5 rounded-lg p-3 ${n.leida ? "bg-hueso-2" : "bg-[#FBF3E4]"}`}>
                    <i className={`ti ${TIPO_ICON[n.tipo] || "ti-bell"} mt-0.5 text-lg text-oliva`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-tinta">{n.mensaje}</p>
                      {n.created_at && (
                        <p className="mt-0.5 text-[11px] text-tinta-suave">{new Date(n.created_at).toLocaleString("es-AR")}</p>
                      )}
                    </div>
                  </div>
                );
                return n.listing_id ? (
                  <Link key={n.id} href={`/publicacion/${n.listing_id}`} onClick={onClose}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
