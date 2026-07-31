export const SITE_URL = "https://www.origeneldoradillo.com.ar";
export const SITE_NAME = "Origen El Doradillo";

// Para declarar `alternates.canonical` en cada página estática — sin esto
// Search Console las marca como "duplicada, sin versión canónica indicada"
// si en algún momento son alcanzables por más de una URL.
export function canonicalUrl(path: string = ""): string {
  return `${SITE_URL}${path}`;
}
