// Validación mínima para números de WhatsApp cargados a mano — el problema
// real que motivó esto: alguien escribió "2804575153 / 1167291458" (dos
// números separados por una barra) en un campo pensado para uno solo, y
// como el resto del código solo hace `.replace(/\D/g, "")` antes de armar
// el link de wa.me, terminó generando un número inválido pegando los dos.

// Se usa en el onChange de los inputs para que sea imposible escribir
// letras, barras, comas, etc. — solo dígitos y separadores visuales comunes
// (espacio, guión, paréntesis, +) mientras se está escribiendo.
export function sanitizeWhatsappInput(raw: string): string {
  return raw.replace(/[^\d\s+()-]/g, "");
}

// Se usa al guardar: separadores visuales fuera, y un largo razonable para
// UN número de teléfono (con o sin +54), no dos pegados.
export function isValidWhatsapp(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

// Casi nadie que se registra pone el "+54 9" — sin eso, wa.me/<numero>
// abre un chat inválido y el contacto por WhatsApp no funciona. Se usa al
// guardar (no en cada tecla) para completar el código de país + el "9" de
// celular argentino si el número cargado no los trae. Devuelve solo
// dígitos, listo para wa.me/<numero>.
export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("54")) return digits;
  if (digits.startsWith("9")) return `54${digits}`;
  return `549${digits}`;
}

export const WHATSAPP_PLACEHOLDER = "Ej: 2804 123456";
export const WHATSAPP_HELP_TEXT = "Un solo número, con código de área (sin 0 ni 15) — el +54 9 se agrega solo. Ejemplo: 2804 123456";
