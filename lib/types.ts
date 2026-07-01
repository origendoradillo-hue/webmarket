export type CategoryKey =
  | "productores"
  | "gastronomia"
  | "oficios"
  | "construccion"
  | "turismo"
  | "hospedaje"
  | "inmuebles";

export interface Category {
  label: string;
  icon: string;
  subs: string[];
}

export type Cuadrante = "Norte" | "Sur" | "Este" | "Oeste";

export type PublisherType = "negocio" | "vecino" | "productor";

export interface Listing {
  id: number;
  nombre: string;
  categoria: CategoryKey;
  subcategoria: string;
  zona: string;
  cuadrante?: Cuadrante;
  direccion?: string;
  barrio?: string;
  icono: string;
  sello: boolean;
  rating: number;
  reseñas: number;
  modalidad: string[];
  descripcion: string;
  iniciales: string;
  foto?: string;
  tipoPublicador: PublisherType;
  cantidad?: number;
  colorMarca?: string;
}
