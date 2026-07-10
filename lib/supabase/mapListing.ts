import { Category, CategoryKey, Listing, TipoPublicacion } from "@/lib/types";
import { ListingRow } from "./types";

const TIPO_ICON: Record<TipoPublicacion, string> = {
  producto: "ti-box",
  servicio: "ti-tools",
  experiencia: "ti-compass",
  inmueble: "ti-home",
  usado: "ti-recycle",
  emprendimiento: "ti-building-store",
  otro: "ti-dots",
};

interface PublisherInfo {
  full_name: string | null;
  nickname?: string | null;
  rating_promedio?: number | null;
  resenas_count?: number | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
}

export function mapListingRow(row: ListingRow, publisher: PublisherInfo | null, categories: Record<string, Category>): Listing {
  const categoria = row.categoria && row.categoria in categories ? (row.categoria as CategoryKey) : undefined;
  const nombrePublicador = publisher?.nickname?.trim() || publisher?.full_name?.trim() || "Vecino de la zona";
  const tipo = (row.tipo as TipoPublicacion) || undefined;

  return {
    id: row.id,
    shortCode: row.short_code,
    nombre: row.nombre,
    subtitulo: row.subtitulo || undefined,
    intencion: row.intencion,
    tipo,
    categoria,
    categoriaLabel: categoria ? categories[categoria].label : undefined,
    subcategoria: row.subcategoria || undefined,
    zona: row.zona,
    cuadrante: (row.cuadrante as Listing["cuadrante"]) || undefined,
    direccion: row.direccion || undefined,
    icono: categoria ? categories[categoria].icon : tipo ? TIPO_ICON[tipo] : "ti-search",
    sello: row.sello,
    destacada: row.destacada,
    emprendimientoDestacado: row.emprendimiento_destacado,
    rating: publisher?.rating_promedio ?? 0,
    reseñas: publisher?.resenas_count ?? 0,
    modalidad: row.modalidad,
    descripcion: row.descripcion,
    iniciales: nombrePublicador
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    foto: row.foto_url || undefined,
    tipoPublicador: row.intencion !== "ofrezco" ? "vecino" : row.rol === "negocio" ? "negocio" : "vecino",
    cantidad: row.cantidad || undefined,
    tags: row.tags,
    etiquetas: (row.etiquetas as Listing["etiquetas"]) || undefined,
    precio: row.precio || undefined,
    precioConsultar: row.precio_a_consultar,
    precioRegalo: row.precio_regalo,
    detalles: row.detalles || undefined,
    whatsappPublico: row.whatsapp_publico,
    publisherId: row.publisher_id,
    publisherName: nombrePublicador,
    publisherInstagram: publisher?.instagram_url || undefined,
    publisherFacebook: publisher?.facebook_url || undefined,
  };
}
