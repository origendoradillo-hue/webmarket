"use client";

import { useEffect, useState } from "react";
import {
  resetPasswordForEmail,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "@/lib/supabase/auth";
import PasswordInput from "./PasswordInput";

type Mode = "login" | "signup" | "forgot" | "reset";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

const TITLES: Record<Mode, string> = {
  login: "Iniciar sesión",
  signup: "Crear cuenta",
  forgot: "Recuperar contraseña",
  reset: "Elegí una contraseña nueva",
};

export default function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "info">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setWhatsapp("");
      setStatus("idle");
      setMessage("");
    }
  }, [open, initialMode]);

  if (!open) return null;

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setMessage("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const error = await signInWithPassword(email, password);
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }
    onClose();
  }

  async function handleSignup(e: React.FormEvent) {
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
    const error = await signUpWithPassword(email, password, fullName, whatsapp);
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }
    setStatus("info");
    setMessage("Te enviamos un email para confirmar tu cuenta. Abrí el link que te mandamos para poder ingresar.");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const error = await resetPasswordForEmail(email);
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }
    setStatus("info");
    setMessage("Te enviamos un email con un link para restablecer tu contraseña.");
  }

  async function handleReset(e: React.FormEvent) {
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
    onClose();
  }

  async function handleGoogle() {
    setStatus("sending");
    const error = await signInWithGoogle();
    if (error) {
      setStatus("error");
      setMessage(error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-w-sm sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">{TITLES[mode]}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-8">
          {mode === "login" && (
            <>
              <p className="mb-5 text-[13px] text-tinta-suave">Ingresá con tu email y contraseña para publicar o contactar.</p>
              <GoogleButton onClick={handleGoogle} disabled={status === "sending"} />
              <Divider />
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <PasswordInput
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={setPassword}
                  wrapperClassName="mb-2"
                />
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="mb-3 block text-[12px] font-medium text-golfo"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <StatusMessage status={status} message={message} />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
                >
                  {status === "sending" ? "Entrando..." : "Entrar"}
                </button>
              </form>
              <p className="mt-4 text-center text-[12.5px] text-tinta-suave">
                ¿No tenés cuenta?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-golfo">
                  Creá una
                </button>
              </p>
            </>
          )}

          {mode === "signup" && (
            <>
              <p className="mb-5 text-[13px] text-tinta-suave">Creá tu cuenta para publicar y contactar a otros vecinos.</p>
              <GoogleButton onClick={handleGoogle} disabled={status === "sending"} />
              <Divider />
              <form onSubmit={handleSignup}>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <input
                  type="tel"
                  required
                  placeholder="Tu WhatsApp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="mb-2.5 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <PasswordInput
                  required
                  placeholder="Contraseña (mínimo 8 caracteres)"
                  value={password}
                  onChange={setPassword}
                  wrapperClassName="mb-2.5"
                />
                <PasswordInput
                  required
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  wrapperClassName="mb-3"
                />
                <StatusMessage status={status} message={message} />
                <button
                  type="submit"
                  disabled={status === "sending" || status === "info"}
                  className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
                >
                  {status === "sending" ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
              <p className="mt-3.5 text-[11px] leading-relaxed text-tinta-suave">
                Solicitamos estos datos para cuidar la seguridad de la comunidad, evitar publicaciones falsas y mantener
                un entorno confiable para vecinos, productores, prestadores y visitantes.
              </p>
              <p className="mt-4 text-center text-[12.5px] text-tinta-suave">
                ¿Ya tenés cuenta?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-golfo">
                  Iniciá sesión
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <p className="mb-5 text-[13px] text-tinta-suave">
                Ingresá tu email y te mandamos un link para elegir una contraseña nueva.
              </p>
              <form onSubmit={handleForgot}>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-piedra/70 px-3 py-2.5 text-[13.5px] text-tinta"
                />
                <StatusMessage status={status} message={message} />
                <button
                  type="submit"
                  disabled={status === "sending" || status === "info"}
                  className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
                >
                  {status === "sending" ? "Enviando..." : "Enviar link"}
                </button>
              </form>
              <p className="mt-4 text-center text-[12.5px] text-tinta-suave">
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-golfo">
                  Volver a iniciar sesión
                </button>
              </p>
            </>
          )}

          {mode === "reset" && (
            <>
              <p className="mb-5 text-[13px] text-tinta-suave">Elegí tu nueva contraseña.</p>
              <form onSubmit={handleReset}>
                <PasswordInput
                  required
                  placeholder="Contraseña nueva (mínimo 8 caracteres)"
                  value={password}
                  onChange={setPassword}
                  wrapperClassName="mb-2.5"
                />
                <PasswordInput
                  required
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  wrapperClassName="mb-3"
                />
                <StatusMessage status={status} message={message} />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
                >
                  {status === "sending" ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-piedra/70 bg-white py-2.5 text-[13.5px] font-semibold text-tinta disabled:opacity-60"
    >
      <i className="ti ti-brand-google text-lg text-golfo" aria-hidden />
      Continuar con Google
    </button>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-2.5">
      <div className="h-px flex-1 bg-piedra/40" />
      <span className="text-[11px] text-tinta-suave">o con email</span>
      <div className="h-px flex-1 bg-piedra/40" />
    </div>
  );
}

function StatusMessage({ status, message }: { status: "idle" | "sending" | "error" | "info"; message: string }) {
  if (status === "error") return <p className="mb-3 text-[12px] text-red-700">{message || "Algo salió mal. Probá de nuevo."}</p>;
  if (status === "info") return <p className="mb-3 text-[12px] text-oliva">{message}</p>;
  return null;
}
