import { Anuncio } from "@/lib/types";
import { AnuncioRow } from "./types";

export function mapAnuncioRow(row: AnuncioRow): Anuncio {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    imagen: row.imagen_url || undefined,
    fechaEvento: row.fecha_evento || undefined,
    lugar: row.lugar || undefined,
    orden: row.orden,
    ubicacion: row.ubicacion,
    layoutType: row.layout_type,
    imageOrientation: row.image_orientation || undefined,
    backgroundImagen: row.background_image_url || undefined,
    ctaLabel: row.cta_label || undefined,
    ctaUrl: row.cta_url || undefined,
  };
}
