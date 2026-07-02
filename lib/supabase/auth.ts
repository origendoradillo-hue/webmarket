import { createClient } from "./client";

function callbackUrl(next?: string) {
  const url = new URL("/auth/callback", window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName: string,
  whatsapp: string
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName.trim(), whatsapp_number: whatsapp.trim() },
      emailRedirectTo: callbackUrl(),
    },
  });
  return error?.message ?? null;
}

export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (!error) return null;
  if (error.message.toLowerCase().includes("email not confirmed")) {
    return "Todavía no confirmaste tu email. Revisá tu bandeja de entrada.";
  }
  return "Email o contraseña incorrectos.";
}

export async function signInWithGoogle(): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl() },
  });
  return error?.message ?? null;
}

export async function resetPasswordForEmail(email: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: callbackUrl("/?reset=1"),
  });
  return error?.message ?? null;
}

export async function updatePassword(newPassword: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error?.message ?? null;
}
