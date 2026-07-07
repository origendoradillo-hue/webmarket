// Antes era una unión literal fija; ahora las categorías viven en la tabla
// `categories` y son editables desde el panel admin, así que el tipo es
// simplemente el id (slug) de la categoría.
export type CategoryKey = string;

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

// Gobierna foto/precio/dirección/campos extra del formulario. Ahora aplica a
// "ofrezco" y "busco" por igual (ambos se navegan por esta categoría).
export type TipoPublicacion = "producto" | "servicio" | "experiencia" | "inmueble" | "usado" | "herramienta" | "otro";

// Etiquetas transversales, combinables con cualquier tipo/rubro.
export type Etiqueta = "turismo" | "alquileres_temporarios";

export interface Listing {
  id: number | string;
  nombre: string;
  intencion: Intencion;
  tipo?: TipoPublicacion;
  categoria?: CategoryKey;
  subcategoria?: string;
  etiquetas?: Etiqueta[];
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
  whatsappPublico?: boolean;
  publisherId?: string;
  publisherName?: string;
}

// Anuncios: eventos, avisos barriales, sponsors, promos, comunicados, ferias,
// novedades — contenido 100% editorial, nunca autoservicio.
export type TipoAnuncio = "evento" | "aviso_barrial" | "sponsor" | "promocion" | "comunicado" | "feria" | "novedad";

// flyer_on_sign: flyer vertical 4:5 enmarcado sobre un fondo horizontal.
// full_banner: imagen horizontal a pantalla completa (diseño original).
// text_only: sin imagen, para avisos institucionales.
// background_image: imagen de fondo ambiental + placa de texto.
export type AnuncioLayoutType = "flyer_on_sign" | "full_banner" | "text_only" | "background_image";
export type ImageOrientation = "vertical" | "horizontal" | "square";

export interface Anuncio {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descripcion: string;
  imagen?: string;
  fechaEvento?: string;
  lugar?: string;
  orden: number;
  ubicacion: "home" | "categoria" | "ambas";
  layoutType: AnuncioLayoutType;
  imageOrientation?: ImageOrientation;
  backgroundImagen?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}
