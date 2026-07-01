import { createClient } from "./client";

// Login sin verificación real: el email alcanza para entrar, sin código ni
// link de confirmación. Por dentro usamos el login por contraseña de
// Supabase con una contraseña derivada del propio email (siempre la misma
// para el mismo email), así no hace falta pedirle nada más a la persona.
//
// Trade-off aceptado a propósito (ver conversación 2026-07-01): cualquiera
// que escriba el email de otra persona entra a esa cuenta — no hay prueba
// de que el email le pertenece. Es intencional para esta etapa de pruebas;
// requiere que en Supabase esté desactivado "Confirm email"
// (Authentication → Providers → Email).
function derivePassword(email: string): string {
  return `origen-doradillo-${email.trim().toLowerCase()}`;
}

export async function instantSignIn(email: string): Promise<string | null> {
  const supabase = createClient();
  const normalized = email.trim().toLowerCase();
  const password = derivePassword(normalized);

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalized, password });
  if (!signInError) return null;

  const { error: signUpError } = await supabase.auth.signUp({ email: normalized, password });
  if (signUpError) return signUpError.message;

  return null;
}
