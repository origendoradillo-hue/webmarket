"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/auth";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const NIVEL_LABEL: Record<number, string> = {
  1: "Nivel 1 · Registrado",
  2: "Nivel 2 · Publicador verificado",
  3: "Nivel 3 · Verificación reforzada",
};

type SaveStatus = "idle" | "sending" | "error" | "info";

export default function ProfileModal({ open, onClose, user }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [pendingRequest, setPendingRequest] = useState<{ nivel_solicitado: number } | null>(null);

  const [profileStatus, setProfileStatus] = useState<SaveStatus>("idle");
  const [profileMessage, setProfileMessage] = useState("");

  const [nivelSolicitado, setNivelSolicitado] = useState<2 | 3>(2);
  const [motivo, setMotivo] = useState("");
  const [verifStatus, setVerifStatus] = useState<SaveStatus>("idle");
  const [verifMessage, setVerifMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setProfileStatus("idle");
    setVerifStatus("idle");
    setPasswordStatus("idle");
    setNewPassword("");
    setConfirmPassword("");
    setMotivo("");

    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("full_name, whatsapp_number, verification_level").eq("id", user.id).single(),
      supabase
        .from("user_verifications")
        .select("nivel_solicitado")
        .eq("user_id", user.id)
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]).then(([profileRes, verifRes]) => {
      if (profileRes.data) {
        setFullName(profileRes.data.full_name ?? "");
        setWhatsapp(profileRes.data.whatsapp_number ?? "");
        setVerificationLevel(profileRes.data.verification_level ?? 1);
      }
      setPendingRequest(verifRes.data ?? null);
      setLoading(false);
    });
  }, [open, user.id]);

  if (!open) return null;

  const emailVerified = !!user.email_confirmed_at;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("sending");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), whatsapp_number: whatsapp.trim() })
      .eq("id", user.id);
    if (error) {
      setProfileStatus("error");
      setProfileMessage(error.message);
      return;
    }
    setProfileStatus("info");
    setProfileMessage("Guardado.");
  }

  async function handleRequestVerification(e: React.FormEvent) {
    e.preventDefault();
    if (motivo.trim() === "") {
      setVerifStatus("error");
      setVerifMessage("Contanos brevemente el motivo.");
      return;
    }
    setVerifStatus("sending");
    const supabase = createClient();
    const { error } = await supabase
      .from("user_verifications")
      .insert({ user_id: user.id, nivel_solicitado: nivelSolicitado, motivo: motivo.trim() });
    if (error) {
      setVerifStatus("error");
      setVerifMessage(error.message);
      return;
    }
    setPendingRequest({ nivel_solicitado: nivelSolicitado });
    setVerifStatus("info");
    setVerifMessage("Solicitud enviada. El equipo la revisa a la brevedad.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordStatus("error");
      setPasswordMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("Las contraseñas no coinciden.");
      return;
    }
    setPasswordStatus("sending");
    const error = await updatePassword(newPassword);
    if (error) {
      setPasswordStatus("error");
      setPasswordMessage(error);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStatus("info");
    setPasswordMessage("Contraseña actualizada.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Mi perfil</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16 text-[13px] text-tinta-suave">Cargando...</div>
        ) : (
          <div className="overflow-y-auto px-5 py-5 sm:px-6">
            <form onSubmit={handleSaveProfile} className="mb-6">
              <Field label="Nombre">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
              </Field>
              <Field label="Email">
                <div className="flex items-center gap-2 rounded-lg border border-piedra/40 bg-hueso-2 px-3 py-2.5 text-[13.5px] text-tinta-suave">
                  <span className="flex-1 truncate">{user.email}</span>
                  {emailVerified ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-oliva">
                      <i className="ti ti-circle-check" aria-hidden /> Verificado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-dorado">
                      <i className="ti ti-alert-circle" aria-hidden /> Sin verificar
                    </span>
                  )}
                </div>
              </Field>
              <StatusMessage status={profileStatus} message={profileMessage} />
              <button
                type="submit"
                disabled={profileStatus === "sending"}
                className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
              >
                {profileStatus === "sending" ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <div className="mb-6 rounded-lg bg-[#F7F3EC] p-3.5">
              <p className="mb-1 text-[12px] font-semibold text-tinta">{NIVEL_LABEL[verificationLevel]}</p>
              <p className="text-[11.5px] leading-relaxed text-tinta-suave">
                Solicitamos estos datos para cuidar la seguridad de la comunidad, evitar publicaciones falsas y mantener
                un entorno confiable para vecinos, productores, prestadores y visitantes.
              </p>
            </div>

            {verificationLevel < 3 && (
              <div className="mb-6">
                <p className="mb-1 font-slab text-[13.5px] font-semibold text-tinta">Verificación reforzada</p>
                <p className="mb-3 text-[12px] text-tinta-suave">
                  Solo hace falta para casos puntuales: inmuebles, alojamientos, publicaciones de alto valor u otro pedido
                  del equipo.
                </p>
                {pendingRequest ? (
                  <p className="rounded-lg bg-hueso-2 px-3 py-2.5 text-[12.5px] text-tinta-suave">
                    Ya tenés una solicitud de Nivel {pendingRequest.nivel_solicitado} en revisión.
                  </p>
                ) : (
                  <form onSubmit={handleRequestVerification}>
                    <Field label="Nivel solicitado">
                      <select
                        value={nivelSolicitado}
                        onChange={(e) => setNivelSolicitado(Number(e.target.value) as 2 | 3)}
                        className="w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                      >
                        <option value={2}>Nivel 2 · Publicador verificado</option>
                        <option value={3}>Nivel 3 · Verificación reforzada</option>
                      </select>
                    </Field>
                    <Field label="Motivo">
                      <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Contanos brevemente por qué pedís esta verificación"
                        className="min-h-[64px] w-full resize-y rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                      />
                    </Field>
                    <StatusMessage status={verifStatus} message={verifMessage} />
                    <button
                      type="submit"
                      disabled={verifStatus === "sending"}
                      className="w-full rounded-lg border border-oliva py-2.5 text-[13.5px] font-semibold text-oliva disabled:opacity-60"
                    >
                      {verifStatus === "sending" ? "Enviando..." : "Solicitar verificación"}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div>
              <p className="mb-3 font-slab text-[13.5px] font-semibold text-tinta">Cambiar contraseña</p>
              <form onSubmit={handleChangePassword}>
                <input
                  type="password"
                  placeholder="Contraseña nueva (mínimo 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <input
                  type="password"
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <StatusMessage status={passwordStatus} message={passwordMessage} />
                <button
                  type="submit"
                  disabled={passwordStatus === "sending"}
                  className="w-full rounded-lg border border-piedra/70 py-2.5 text-[13.5px] font-semibold text-tinta disabled:opacity-60"
                >
                  {passwordStatus === "sending" ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">{label}</label>
      {children}
    </div>
  );
}

function StatusMessage({ status, message }: { status: SaveStatus; message: string }) {
  if (status === "error") return <p className="mb-3 text-[12px] text-red-700">{message}</p>;
  if (status === "info") return <p className="mb-3 text-[12px] text-oliva">{message}</p>;
  return null;
}
