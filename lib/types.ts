export type CategoryKey =
  | "productores"
  | "gastronomia"
  | "oficios"
  | "construccion"
  | "turismo"
  | "hospedaje"
  | "inmuebles"
  | "usados";

export interface Category {
  label: string;
  icon: string;
  subs: string[];
}

export type Cuadrante = "Norte" | "Sur" | "Este" | "Oeste";

export type PublisherType = "negocio" | "vecino" | "productor";

// "Ofrezco" o "Busco" — el eje viejo tipoAviso, sin "evento" (los eventos
// ahora son Anuncios, ver tipo Anuncio más abajo).
export type Intencion = "ofrezco" | "busco";

// Gobierna foto/precio/dirección/campos extra del formulario. Solo aplica
// cuando intencion === "ofrezco" — "busco" tiene sus propias reglas fijas.
export type TipoPublicacion = "producto" | "servicio" | "experiencia" | "inmueble" | "usado_herramienta" | "otro";

export interface Listing {
  id: number | string;
  isReal?: boolean;
  nombre: string;
  intencion: Intencion;
  tipo?: TipoPublicacion;
  categoria?: CategoryKey;
  subcategoria?: string;
  zona: string;
  cuadrante?: Cuadrante;
  direccion?: string;
  barrio?: string;
  icono: string;
  sello: boolean;
  destacada: boolean;
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
  precio?: number;
  precioConsultar?: boolean;
  detalles?: Record<string, unknown>;
}

// Anuncios: eventos, avisos barriales, sponsors, promos, comunicados, ferias,
// novedades — contenido 100% editorial, nunca autoservicio.
export type TipoAnuncio = "evento" | "aviso_barrial" | "sponsor" | "promocion" | "comunicado" | "feria" | "novedad";

export interface Anuncio {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descripcion: string;
  imagen?: string;
  fechaEvento?: string;
  lugar?: string;
  orden: number;
}
