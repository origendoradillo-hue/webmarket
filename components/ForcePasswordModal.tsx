"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { updatePassword } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

interface ForcePasswordModalProps {
  open: boolean;
  user: User;
  onDone: () => void;
}

export default function ForcePasswordModal({ open, user, onDone }: ForcePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setStatus("sending");
    const error = await updatePassword(password);
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }
    const supabase = createClient();
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-oliva-dd/70 sm:items-center sm:p-6">
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-w-sm sm:rounded-2xl">
        <div className="border-b border-piedra/50 px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Elegí una contraseña nueva</span>
        </div>
        <div className="flex flex-1 flex-col justify-center px-6 py-8">
          <p className="mb-5 text-[13px] text-tinta-suave">
            Tu cuenta se creó con una contraseña temporal. Antes de seguir, elegí una contraseña propia.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              required
              placeholder="Contraseña nueva (mínimo 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
            />
            <input
              type="password"
              required
              placeholder="Repetí la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
            />
            {status === "error" && <p className="mb-3 text-[12px] text-red-700">{message}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
            >
              {status === "sending" ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
