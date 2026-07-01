import { Listing } from "./types";

// Número de demo — se reemplaza por el WhatsApp real de cada publicador cuando
// haya backend (ver ARQUITECTURA.md, sección 8: el número real nunca viaja
// en el payload público, se resuelve server-side al click).
const DEMO_WHATSAPP = "5492804000000";

export function buildWhatsappLink(listing: Listing): string {
  const mensaje = `Hola, vi tu publicación de ${listing.nombre} en Origen El Doradillo`;
  return `https://wa.me/${DEMO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
