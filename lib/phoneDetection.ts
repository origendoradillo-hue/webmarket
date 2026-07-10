// Detecta números de teléfono escritos a mano en texto libre (la
// descripción de una publicación) para avisar y, al guardar, ocultarlos:
// el contacto tiene que pasar por el botón de Contactar de la
// plataforma, no filtrarse directo a WhatsApp por la descripción.
//
// El umbral de 7 dígitos reales en una misma corrida evita falsos
// positivos en texto común ("cuenta con 3 habitaciones", "modelo
// 2021") sin dejar pasar teléfonos reales (8-10 dígitos con
// característica en Argentina).
const CANDIDATE_REGEX = /\d[\d\s().-]{5,}\d/g;
const MIN_DIGITS = 7;

export function containsPhoneNumber(text: string): boolean {
  const matches = text.match(CANDIDATE_REGEX);
  if (!matches) return false;
  return matches.some((m) => (m.match(/\d/g) || []).length >= MIN_DIGITS);
}

export function maskPhoneNumbers(text: string): { masked: string; found: boolean } {
  let found = false;
  const masked = text.replace(CANDIDATE_REGEX, (match) => {
    const digitCount = (match.match(/\d/g) || []).length;
    if (digitCount < MIN_DIGITS) return match;
    found = true;
    return match.replace(/\d/g, "•");
  });
  return { masked, found };
}
