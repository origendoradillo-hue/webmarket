import { Anuncio, Category, CategoryKey } from "./types";

// Valor de respaldo: la fuente de verdad ahora es la tabla `categories` en
// Supabase (editable desde el panel admin). Esto se usa como estado inicial
// de useCategories() hasta que el fetch resuelve, y como fallback si falla.
export const CATEGORIES: Record<CategoryKey, Category> = {
  productores: {
    label: "Productores y chacras",
    icon: "ti-leaf",
    subs: [
      "Aceite y frutos secos",
      "Huevos y aviar",
      "Miel y dulces caseros",
      "Verduras y quintas",
      "Forrajería",
      "Viveros y plantines",
    ],
  },
  gastronomia: {
    label: "Gastronomía",
    icon: "ti-bread",
    subs: ["Panadería y pastelería", "Comidas preparadas", "Dulces y conservas", "Foodtrucks y eventos"],
  },
  oficios: {
    label: "Oficios y servicios",
    icon: "ti-tools",
    subs: [
      "Herrería y forja",
      "Electricidad",
      "Plomería",
      "Jardinería y poda",
      "Cuidado de animales",
      "Transporte y flete",
      "Limpieza",
    ],
  },
  construccion: {
    label: "Construcción y ramos generales",
    icon: "ti-building-warehouse",
    subs: ["Albañilería", "Bioconstrucción", "Ferretería y ramos generales", "Corralón e insumos", "Herramientas"],
  },
  turismo: {
    label: "Turismo y experiencias",
    icon: "ti-compass",
    subs: ["Cabalgatas", "Avistaje y trekking", "Excursiones 4x4", "Eventos y celebraciones"],
  },
  hospedaje: {
    label: "Hotelería y hospedaje",
    icon: "ti-bed",
    subs: ["Cabañas", "Hostería", "Camping", "Alquiler temporario"],
  },
  inmuebles: {
    label: "Inmuebles",
    icon: "ti-home",
    subs: ["Venta de lotes y chacras", "Alquiler", "Terrenos con mejoras"],
  },
  // "Usado o herramienta" es su propia categoría de nivel superior (no
  // depende de las 7 de rubro) — pedido explícito: sumar Electrodomésticos
  // y Materiales de construcción, muy vendidos usados en el barrio.
  usados: {
    label: "Usados y herramientas",
    icon: "ti-recycle",
    subs: ["Herramientas", "Electrodomésticos", "Materiales de construcción", "Muebles", "Otros usados"],
  },
};

// Valor de respaldo mientras useCategories() todavía no trajo las zonas
// reales desde la tabla `zones` (o si la tabla está vacía).
export const ZONES = ["Zona 1", "Zona 2", "Zona 3"];

// Colores de respaldo para thumbnails sin foto ni marca propia.
export const FALLBACK_COLORS = ["#4A5D3A", "#5C3D2E", "#4C6B70", "#33402A", "#8A6A3A"];

// Los ids reales de Supabase son UUID (string), los de ejemplo son number.
// Convierte cualquiera de los dos en un índice estable para elegir color.
export function fallbackColorFor(id: number | string): string {
  const n = typeof id === "number" ? id : id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[n % FALLBACK_COLORS.length];
}

export const ANUNCIOS: Anuncio[] = [
  {
    id: "a1",
    tipo: "evento",
    titulo: "Feria de productores de El Doradillo",
    descripcion: "Feria mensual con productores de la zona: aceite, miel, dulces, verduras y artesanías. Entrada libre y gratuita.",
    fechaEvento: "2026-08-15",
    lugar: "Club de campo, acceso norte",
    orden: 1,
    ubicacion: "ambas",
  },
  {
    id: "a2",
    tipo: "aviso_barrial",
    titulo: "Corte de luz programado en Zona 2",
    descripcion: "La cooperativa eléctrica informa un corte programado por mantenimiento el próximo martes de 9 a 13hs en Zona 2.",
    orden: 2,
    ubicacion: "ambas",
  },
  {
    id: "a3",
    tipo: "promocion",
    titulo: "Ramos Generales La Estepa: 10% en compras de obra",
    descripcion: "Durante agosto, 10% de descuento en materiales de construcción comprando más de $50.000.",
    orden: 3,
    ubicacion: "ambas",
  },
];
