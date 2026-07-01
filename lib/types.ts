export type CategoryKey =
  | "productores"
  | "gastronomia"
  | "oficios"
  | "construccion"
  | "turismo"
  | "hospedaje"
  | "inmuebles"
  | "otro";

export interface Category {
  label: string;
  icon: string;
  subs: string[];
}

export type Cuadrante = "Norte" | "Sur" | "Este" | "Oeste";

export type PublisherType = "negocio" | "vecino" | "productor";

export type TipoAviso = "oferta" | "demanda" | "evento";

export interface Listing {
  id: number | string;
  isReal?: boolean;
  nombre: string;
  tipoAviso: TipoAviso;
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
  tags?: string[];
}
