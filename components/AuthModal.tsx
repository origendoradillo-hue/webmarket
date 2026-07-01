"use client";

import { useState } from "react";
import { instantSignIn } from "@/lib/supabase/instantAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const error = await instantSignIn(email);
    if (error) {
      setErrorMsg(error);
      setStatus("error");
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-w-sm sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Ingresar</span>
          <button onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-8">
          <p className="mb-1 font-slab text-lg font-semibold text-tinta">Para publicar o contactar</p>
          <p className="mb-5 text-[13px] text-tinta-suave">Ingresá tu email para entrar. No hace falta contraseña ni confirmar nada.</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
            />
            {status === "error" && <p className="mb-3 text-[12px] text-red-700">{errorMsg || "Algo salió mal. Probá de nuevo."}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
            >
              {status === "sending" ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
