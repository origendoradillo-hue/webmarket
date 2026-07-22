import { Anuncio } from "@/lib/types";
import { AnuncioRow } from "./types";

export function mapAnuncioRow(row: AnuncioRow): Anuncio {
  return {
    id: row.id,
    shortCode: row.short_code,
    tipo: row.tipo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    imagen: row.imagen_url || undefined,
    fechaEvento: row.fecha_evento || undefined,
    lugar: row.lugar || undefined,
    orden: row.orden,
    ubicacion: row.ubicacion,
    layoutType: row.layout_type,
    backgroundImagen: row.background_image_url || undefined,
    ctaLabel: row.cta_label || undefined,
    ctaUrl: row.cta_url || undefined,
    whatsappNumero: row.whatsapp_numero || undefined,
    redesUrl: row.redes_url || undefined,
  };
}
