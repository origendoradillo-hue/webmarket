import { Category, CategoryKey } from "./types";

// Valor de respaldo: la fuente de verdad ahora es la tabla `categories` en
// Supabase (editable desde el panel admin). Esto se usa como estado inicial
// de useCategories() hasta que el fetch resuelve, y como fallback si falla.
export const CATEGORIES: Record<CategoryKey, Category> = {
  productores: {
    label: "Productores y chacras",
    icon: "ti-leaf",
    tipoScope: ["producto", "emprendimiento"],
    subs: ["Verduras y frutas", "Huevos y lácteos", "Miel y dulces", "Plantas y vivero", "Forrajería", "Otros de chacra"],
  },
  gastronomia: {
    label: "Gastronomía",
    icon: "ti-bread",
    tipoScope: ["producto", "emprendimiento"],
    subs: ["Panificados", "Conservas y ahumados", "Bebidas", "Otros alimentos"],
  },
  producto_instrumentos: {
    label: "Instrumentos",
    icon: "ti-guitar-pick",
    tipoScope: ["producto", "emprendimiento"],
    subs: ["Percusión", "Cuerdas", "Vientos", "Accesorios"],
  },
  producto_otros: {
    label: "Otros productos",
    icon: "ti-dots",
    tipoScope: ["producto", "emprendimiento"],
    subs: [],
  },
  oficios: {
    label: "Oficios y servicios",
    icon: "ti-tools",
    tipoScope: ["servicio", "emprendimiento"],
    subs: ["Plomería", "Electricidad", "Gasista", "Jardinería", "Limpieza", "Cuidado de mascotas", "Otros oficios"],
  },
  construccion: {
    label: "Construcción y ramos generales",
    icon: "ti-building-warehouse",
    tipoScope: ["servicio", "emprendimiento"],
    subs: ["Albañilería", "Herrería", "Pintura", "Provisión de materiales"],
  },
  servicio_otros: {
    label: "Otros servicios",
    icon: "ti-dots",
    tipoScope: ["servicio", "emprendimiento"],
    subs: [],
  },
  turismo: {
    label: "Turismo y experiencias",
    icon: "ti-compass",
    tipoScope: ["experiencia"],
    subs: ["Cabalgatas", "Avistaje de fauna", "Paseos guiados", "Degustaciones", "Talleres", "Otras experiencias"],
  },
  hospedaje: {
    label: "Hotelería y hospedaje",
    icon: "ti-bed",
    tipoScope: ["inmueble"],
    subs: ["Cabañas", "Habitaciones", "Casas completas"],
  },
  inmueble_alquiler: {
    label: "Alquiler permanente",
    icon: "ti-key",
    tipoScope: ["inmueble"],
    subs: [],
  },
  inmueble_venta: {
    label: "Venta",
    icon: "ti-home-dollar",
    tipoScope: ["inmueble"],
    subs: [],
  },
  inmueble_terrenos: {
    label: "Terrenos y chacras",
    icon: "ti-map-2",
    tipoScope: ["inmueble"],
    subs: [],
  },
  usado_herramientas: {
    label: "Herramientas",
    icon: "ti-hammer",
    tipoScope: ["usado"],
    subs: [],
  },
  usado_instrumentos: {
    label: "Instrumentos",
    icon: "ti-guitar-pick",
    tipoScope: ["usado"],
    subs: [],
  },
  usado_muebles: {
    label: "Muebles y hogar",
    icon: "ti-armchair",
    tipoScope: ["usado"],
    subs: [],
  },
  usado_vehiculos: {
    label: "Vehículos",
    icon: "ti-car",
    tipoScope: ["usado"],
    subs: [],
  },
  usado_otros: {
    label: "Otros usados",
    icon: "ti-dots",
    tipoScope: ["usado"],
    subs: [],
  },
  otro_varios: {
    label: "Varios",
    icon: "ti-dots",
    tipoScope: ["otro"],
    subs: [],
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
