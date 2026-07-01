import { CATEGORIES } from "@/lib/data";
import { CategoryKey, Listing } from "@/lib/types";
import { ListingRow } from "./types";

export function mapListingRow(row: ListingRow, publisherName: string | null): Listing {
  const categoria = (row.categoria as CategoryKey) in CATEGORIES ? (row.categoria as CategoryKey) : "otro";
  const nombrePublicador = publisherName?.trim() || "Vecino de la zona";

  return {
    id: row.id,
    isReal: true,
    nombre: row.nombre,
    tipoAviso: row.tipo_aviso,
    categoria,
    subcategoria: row.subcategoria,
    zona: row.zona,
    cuadrante: (row.cuadrante as Listing["cuadrante"]) || undefined,
    direccion: row.direccion || undefined,
    icono: CATEGORIES[categoria].icon,
    sello: false,
    rating: 0,
    reseñas: 0,
    modalidad: row.modalidad,
    descripcion: row.descripcion,
    iniciales: nombrePublicador
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    foto: row.foto_url || undefined,
    tipoPublicador: row.tipo_aviso !== "oferta" ? "vecino" : row.rol === "negocio" ? "negocio" : "vecino",
    cantidad: row.cantidad || undefined,
    tags: row.tags,
  };
}
