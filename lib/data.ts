import { Anuncio, Category, CategoryKey, Listing } from "./types";

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

// Colores de respaldo para thumbnails sin foto ni marca propia.
export const FALLBACK_COLORS = ["#4A5D3A", "#5C3D2E", "#4C6B70", "#33402A", "#8A6A3A"];

// Los ids reales de Supabase son UUID (string), los de ejemplo son number.
// Convierte cualquiera de los dos en un índice estable para elegir color.
export function fallbackColorFor(id: number | string): string {
  const n = typeof id === "number" ? id : id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[n % FALLBACK_COLORS.length];
}

const img = (file: string) => `/images/listings/${file}`;

export const LISTINGS: Listing[] = [
  { id: 1, nombre: "Olivar Los Surcos", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Aceite y frutos secos", zona: "Zona 2", direccion: "Chacra 14, camino interno", cuadrante: "Norte", icono: "ti-droplet", sello: true, destacada: true, rating: 4.8, reseñas: 12, modalidad: ["Retiro", "Envío"], descripcion: "Aceite de oliva extra virgen prensado en frío, botellas de 500ml y 1L.", iniciales: "OS", foto: img("olivar-los-surcos.jpg"), tipoPublicador: "negocio", colorMarca: "#33402A", tags: ["aceite de oliva", "extra virgen", "prensado en frío"], precio: 4500 },
  { id: 2, nombre: "Granja Doña Rosa", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Huevos y aviar", zona: "Zona 1", cuadrante: "Oeste", icono: "ti-egg", sello: false, destacada: false, rating: 4.7, reseñas: 9, modalidad: ["Retiro"], descripcion: "Huevos de campo y pollo casero, disponibilidad recurrente todo el año.", iniciales: "DR", foto: img("granja-dona-rosa.jpg"), tipoPublicador: "productor", precio: 2200 },
  { id: 3, nombre: "Colmenar del Golfo", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Miel y dulces caseros", zona: "Zona 2", direccion: "Camino a la costa", cuadrante: "Este", icono: "ti-flower", sello: true, destacada: true, rating: 5.0, reseñas: 6, modalidad: ["Retiro", "Envío"], descripcion: "Miel pura de estepa patagónica, cosecha propia, frascos de 500g y 1kg.", iniciales: "CG", foto: img("colmenar-del-golfo.jpg"), tipoPublicador: "productor", tags: ["miel", "estepa", "artesanal"], precio: 3800 },
  { id: 4, nombre: "Quinta Los Aromos", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Verduras y quintas", zona: "Zona 3", icono: "ti-carrot", sello: false, destacada: false, rating: 4.5, reseñas: 8, modalidad: ["Retiro"], descripcion: "Verduras de estación cultivadas con riego de reuso, bolsón semanal.", iniciales: "LA", tipoPublicador: "productor", precioConsultar: true },
  { id: 5, nombre: "Forrajería El Establo", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Forrajería", zona: "Zona 1", icono: "ti-wheat", sello: false, destacada: false, rating: 4.6, reseñas: 14, modalidad: ["A domicilio", "Retiro"], descripcion: "Alimento balanceado, fardos y suplementos para animales de chacra.", iniciales: "EE", tipoPublicador: "productor", precioConsultar: true },
  { id: 6, nombre: "Vivero Lavanda Seca", intencion: "ofrezco", tipo: "producto", categoria: "productores", subcategoria: "Viveros y plantines", zona: "Zona 1", direccion: "Ruta de acceso norte", cuadrante: "Norte", icono: "ti-plant", sello: true, destacada: false, rating: 4.7, reseñas: 9, modalidad: ["Retiro"], descripcion: "Plantines nativos, lavanda y forestación joven adaptada a la estepa.", iniciales: "VL", foto: img("vivero-lavanda-seca.jpg"), tipoPublicador: "productor", precio: 1500 },

  { id: 7, nombre: "Panadería de Campo", intencion: "ofrezco", tipo: "producto", categoria: "gastronomia", subcategoria: "Panadería y pastelería", zona: "Zona 2", direccion: "Chacra 22", cuadrante: "Norte", icono: "ti-bread", sello: false, destacada: true, rating: 4.9, reseñas: 21, modalidad: ["Retiro", "Envío"], descripcion: "Pan de masa madre y facturas, horneado a leña dos veces por semana.", iniciales: "PC", foto: img("panaderia-de-campo.jpg"), tipoPublicador: "productor", tags: ["pan", "masa madre", "horno a leña"], precio: 2800 },
  { id: 8, nombre: "Viandas La Chacra", intencion: "ofrezco", tipo: "producto", categoria: "gastronomia", subcategoria: "Comidas preparadas", zona: "Zona 3", icono: "ti-soup", sello: false, destacada: false, rating: 4.6, reseñas: 11, modalidad: ["A domicilio"], descripcion: "Viandas caseras semanales, menú rotativo con productos de la zona.", iniciales: "LC", tipoPublicador: "productor", precioConsultar: true },
  { id: 9, nombre: "Conservas Doña Inés", intencion: "ofrezco", tipo: "producto", categoria: "gastronomia", subcategoria: "Dulces y conservas", zona: "Zona 1", direccion: "Chacra 9", cuadrante: "Sur", icono: "ti-jar", sello: true, destacada: false, rating: 5.0, reseñas: 15, modalidad: ["Retiro", "Envío"], descripcion: "Dulces artesanales y conservas en frascos, recetas de campo tradicionales.", iniciales: "DI", foto: img("conservas-dona-ines.jpg"), tipoPublicador: "productor", precio: 3200 },
  { id: 10, nombre: "Food Truck Estepa Sur", intencion: "ofrezco", tipo: "servicio", categoria: "gastronomia", subcategoria: "Foodtrucks y eventos", zona: "Zona 3", icono: "ti-truck", sello: false, destacada: false, rating: 4.4, reseñas: 7, modalidad: ["A domicilio"], descripcion: "Cocina a la parrilla para eventos y celebraciones en toda la zona.", iniciales: "ES", tipoPublicador: "productor", precioConsultar: true },

  { id: 11, nombre: "Herrería El Ripio", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Herrería y forja", zona: "Zona 3", icono: "ti-hammer", sello: false, destacada: false, rating: 4.6, reseñas: 19, modalidad: ["A domicilio", "Retiro"], descripcion: "Forja y reparación de herramientas, rejas y estructuras metálicas.", iniciales: "ER", tipoPublicador: "productor", precioConsultar: true },
  { id: 12, nombre: "Electricidad Rural Fenoglio", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Electricidad", zona: "Zona 1", cuadrante: "Norte", icono: "ti-bolt", sello: false, destacada: true, rating: 4.8, reseñas: 16, modalidad: ["A domicilio"], descripcion: "Instalaciones eléctricas rurales, paneles solares y mantenimiento.", iniciales: "RF", foto: img("electricidad-rural-fenoglio.jpg"), tipoPublicador: "productor", precioConsultar: true },
  { id: 13, nombre: "Plomería Zona Norte", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Plomería", zona: "Zona 2", icono: "ti-droplet", sello: false, destacada: false, rating: 4.5, reseñas: 10, modalidad: ["A domicilio"], descripcion: "Reparación de bombas de agua, cañerías y sistemas de riego.", iniciales: "ZN", tipoPublicador: "productor", precioConsultar: true },
  { id: 14, nombre: "Poda y Jardín Patagónico", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Jardinería y poda", zona: "Zona 2", cuadrante: "Este", icono: "ti-scissors", sello: false, destacada: false, rating: 4.7, reseñas: 13, modalidad: ["A domicilio"], descripcion: "Poda de forestación joven, mantenimiento de espacios verdes en chacra.", iniciales: "JP", foto: img("poda-y-jardin-patagonico.jpg"), tipoPublicador: "productor", precioConsultar: true },
  { id: 15, nombre: "Cuidador de Animales Martín", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Cuidado de animales", zona: "Zona 3", cuadrante: "Este", icono: "ti-paw", sello: false, destacada: false, rating: 4.9, reseñas: 22, modalidad: ["A domicilio"], descripcion: "Cuidado de animales de campo durante ausencias, visitas diarias.", iniciales: "CM", foto: img("cuidador-de-animales-martin.jpg"), tipoPublicador: "productor", precioConsultar: true },
  { id: 16, nombre: "Fletes El Doradillo", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Transporte y flete", zona: "Zona 1", icono: "ti-truck-delivery", sello: false, destacada: false, rating: 4.6, reseñas: 18, modalidad: ["A domicilio"], descripcion: "Flete y mudanzas dentro del barrio y hacia Puerto Madryn.", iniciales: "FD", tipoPublicador: "productor", precioConsultar: true },
  { id: 17, nombre: "Limpieza de Chacras Sur", intencion: "ofrezco", tipo: "servicio", categoria: "oficios", subcategoria: "Limpieza", zona: "Zona 3", icono: "ti-spray", sello: false, destacada: false, rating: 4.4, reseñas: 8, modalidad: ["A domicilio"], descripcion: "Limpieza de terrenos, desmalezado y mantenimiento de parcelas.", iniciales: "CS", tipoPublicador: "productor", precioConsultar: true },

  { id: 18, nombre: "Albañilería Hnos. Coliqueo", intencion: "ofrezco", tipo: "servicio", categoria: "construccion", subcategoria: "Albañilería", zona: "Zona 2", cuadrante: "Sur", icono: "ti-brick", sello: false, destacada: false, rating: 4.7, reseñas: 14, modalidad: ["A domicilio"], descripcion: "Construcción y ampliaciones, presupuesto sin cargo a domicilio.", iniciales: "HC", foto: img("albanileria-hnos-coliqueo.jpg"), tipoPublicador: "productor", precioConsultar: true },
  { id: 19, nombre: "Bioconstrucción Tierra Viva", intencion: "ofrezco", tipo: "servicio", categoria: "construccion", subcategoria: "Bioconstrucción", zona: "Zona 1", icono: "ti-recycle", sello: true, destacada: true, rating: 4.9, reseñas: 11, modalidad: ["A domicilio"], descripcion: "Construcción en adobe y quincha, diseño bioclimático para la estepa.", iniciales: "TV", tipoPublicador: "negocio", colorMarca: "#4A3420", precioConsultar: true },
  { id: 20, nombre: "Ramos Generales La Estepa", intencion: "ofrezco", tipo: "producto", categoria: "construccion", subcategoria: "Ferretería y ramos generales", zona: "Zona 2", direccion: "Avenida principal del barrio", icono: "ti-building-store", sello: false, destacada: false, rating: 4.5, reseñas: 20, modalidad: ["Retiro", "Envío"], descripcion: "Ferretería, insumos rurales y materiales para obra, todo en un lugar.", iniciales: "LE", tipoPublicador: "productor", precioConsultar: true },
  { id: 21, nombre: "Corralón El Ripio", intencion: "ofrezco", tipo: "producto", categoria: "construccion", subcategoria: "Corralón e insumos", zona: "Zona 3", direccion: "Camino de ripio sur", icono: "ti-package", sello: false, destacada: false, rating: 4.4, reseñas: 9, modalidad: ["Retiro", "Envío"], descripcion: "Áridos, ladrillos y materiales de construcción con entrega en zona.", iniciales: "CR", tipoPublicador: "productor", precioConsultar: true },
  { id: 22, nombre: "Herramientas y Forja Patagonia", intencion: "ofrezco", tipo: "producto", categoria: "construccion", subcategoria: "Herramientas", zona: "Zona 3", icono: "ti-tool", sello: false, destacada: false, rating: 4.6, reseñas: 12, modalidad: ["Retiro"], descripcion: "Venta y afilado de herramientas de mano para chacra y obra.", iniciales: "FP", tipoPublicador: "productor", precioConsultar: true },

  { id: 23, nombre: "Cabalgatas Estepa Norte", intencion: "ofrezco", tipo: "experiencia", categoria: "turismo", subcategoria: "Cabalgatas", zona: "Zona 3", icono: "ti-horse", sello: true, destacada: true, rating: 5.0, reseñas: 14, modalidad: ["A domicilio"], descripcion: "Cabalgatas guiadas por la estepa al atardecer, grupos reducidos.", iniciales: "EN", tipoPublicador: "negocio", colorMarca: "#5C3D2E", tags: ["cabalgatas", "estepa", "atardecer"], precio: 8000, etiquetas: ["turismo"] },
  { id: 24, nombre: "Avistaje Doradillo", intencion: "ofrezco", tipo: "experiencia", categoria: "turismo", subcategoria: "Avistaje y trekking", zona: "Zona 2", cuadrante: "Este", icono: "ti-binoculars", sello: false, destacada: false, rating: 4.8, reseñas: 17, modalidad: ["A domicilio"], descripcion: "Salidas de avistaje de fauna costera y trekking por el parque.", iniciales: "AD", foto: img("avistaje-doradillo.jpg"), tipoPublicador: "productor", precio: 6000, etiquetas: ["turismo"] },
  { id: 25, nombre: "Excursiones 4x4 Golfo Nuevo", intencion: "ofrezco", tipo: "experiencia", categoria: "turismo", subcategoria: "Excursiones 4x4", zona: "Zona 1", icono: "ti-car", sello: false, destacada: false, rating: 4.6, reseñas: 10, modalidad: ["A domicilio"], descripcion: "Recorridos en 4x4 por caminos de ripio y costa del golfo.", iniciales: "GN", tipoPublicador: "productor", precio: 9500, etiquetas: ["turismo"] },
  { id: 26, nombre: "Eventos a Campo Abierto", intencion: "ofrezco", tipo: "servicio", categoria: "turismo", subcategoria: "Eventos y celebraciones", zona: "Zona 2", cuadrante: "Oeste", icono: "ti-confetti", sello: false, destacada: false, rating: 4.7, reseñas: 8, modalidad: ["A domicilio"], descripcion: "Organización de eventos y celebraciones en espacios de chacra.", iniciales: "CA", foto: img("eventos-a-campo-abierto.jpg"), tipoPublicador: "productor", precioConsultar: true },

  { id: 27, nombre: "Cabañas del Golfo", intencion: "ofrezco", tipo: "servicio", categoria: "hospedaje", subcategoria: "Cabañas", zona: "Zona 2", direccion: "Camino costero, km 6", icono: "ti-home", sello: true, destacada: true, rating: 4.9, reseñas: 31, modalidad: ["Retiro"], descripcion: "Cabañas equipadas con vista a la estepa, a minutos de la costa.", iniciales: "CG", tipoPublicador: "negocio", colorMarca: "#4C6B70", tags: ["cabañas", "costa", "vista al golfo"], precio: 45000, etiquetas: ["turismo", "alquileres_temporarios"] },
  { id: 28, nombre: "Hostería Refugio del Golfo", intencion: "ofrezco", tipo: "servicio", categoria: "hospedaje", subcategoria: "Hostería", zona: "Zona 2", direccion: "Camino costero, km 7", cuadrante: "Sur", icono: "ti-building", sello: false, destacada: false, rating: 4.8, reseñas: 24, modalidad: ["Retiro"], descripcion: "Hostería boutique con desayuno de productos locales incluido.", iniciales: "RG", foto: img("hosteria-refugio-del-golfo.jpg"), tipoPublicador: "productor", precio: 38000, etiquetas: ["turismo", "alquileres_temporarios"] },
  { id: 29, nombre: "Camping Chacras Madryn", intencion: "ofrezco", tipo: "servicio", categoria: "hospedaje", subcategoria: "Camping", zona: "Zona 1", direccion: "Acceso norte del barrio", icono: "ti-tent", sello: false, destacada: false, rating: 4.5, reseñas: 19, modalidad: ["Retiro"], descripcion: "Camping con parcelas amplias, fogones y acceso a agua potable.", iniciales: "CM", tipoPublicador: "productor", precio: 5000 },
  { id: 30, nombre: "Alquiler Temporario Norte", intencion: "ofrezco", tipo: "servicio", categoria: "hospedaje", subcategoria: "Alquiler temporario", zona: "Zona 3", icono: "ti-key", sello: false, destacada: false, rating: 4.6, reseñas: 13, modalidad: ["Retiro"], descripcion: "Casa de campo en alquiler temporario, ideal para estadías cortas.", iniciales: "AN", tipoPublicador: "productor", precioConsultar: true },

  { id: 31, nombre: "Lote Chacra 8ha", intencion: "ofrezco", tipo: "inmueble", categoria: "inmuebles", subcategoria: "Venta de lotes y chacras", zona: "Zona 1", cuadrante: "Sur", icono: "ti-map-2", sello: false, destacada: true, rating: 4.9, reseñas: 5, modalidad: ["Retiro"], descripcion: "Lote de 8 hectáreas con acceso a ripio, apto forestación.", iniciales: "LC", foto: img("lote-chacra-8ha.jpg"), tipoPublicador: "productor", precioConsultar: true },
  { id: 32, nombre: "Alquiler Casa de Campo", intencion: "ofrezco", tipo: "inmueble", categoria: "inmuebles", subcategoria: "Alquiler", zona: "Zona 2", icono: "ti-home-2", sello: false, destacada: false, rating: 4.7, reseñas: 6, modalidad: ["Retiro"], descripcion: "Casa de campo en alquiler anual, 3 dormitorios y galpón.", iniciales: "AC", tipoPublicador: "productor", precioConsultar: true },
  { id: 33, nombre: "Terreno con Mejoras Zona 2", intencion: "ofrezco", tipo: "inmueble", categoria: "inmuebles", subcategoria: "Terrenos con mejoras", zona: "Zona 2", cuadrante: "Oeste", icono: "ti-fence", sello: true, destacada: false, rating: 5.0, reseñas: 4, modalidad: ["Retiro"], descripcion: "Terreno cercado con pozo de agua y forestación ya implantada.", iniciales: "TM", foto: img("terreno-con-mejoras-zona-2.jpg"), tipoPublicador: "productor", precioConsultar: true },

  { id: 34, nombre: "Martillos usados", intencion: "ofrezco", tipo: "herramienta", categoria: "usados", subcategoria: "Herramientas", zona: "Zona 3", icono: "ti-hammer", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Vendo martillos usados en buen estado.", iniciales: "", tipoPublicador: "vecino", cantidad: 3, tags: ["herramientas", "usado", "martillo"], precio: 4500 },
  { id: 35, nombre: "Leña seca", intencion: "ofrezco", tipo: "usado", categoria: "usados", subcategoria: "Otros usados", zona: "Zona 1", icono: "ti-flame", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Vendo leña seca de jarilla en bolsones de 40kg.", iniciales: "", tipoPublicador: "vecino", cantidad: 6, tags: ["leña", "jarilla", "calefacción"], precio: 3000 },
  { id: 36, nombre: "Heladera usada", intencion: "ofrezco", tipo: "usado", categoria: "usados", subcategoria: "Electrodomésticos", zona: "Zona 2", icono: "ti-fridge", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Heladera de 300L en buen estado, funciona perfecto, me sobró al mudarme.", iniciales: "", tipoPublicador: "vecino", cantidad: 1, tags: ["heladera", "electrodomésticos", "usado"], precio: 90000 },
  { id: 37, nombre: "Chapas y perfiles usados", intencion: "ofrezco", tipo: "usado", categoria: "usados", subcategoria: "Materiales de construcción", zona: "Zona 1", icono: "ti-building-warehouse", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Sobrante de obra: chapas acanaladas y perfiles de hierro, buen estado.", iniciales: "", tipoPublicador: "vecino", cantidad: 12, tags: ["chapas", "materiales", "obra"], precio: 25000 },

  // Ejemplos de "busco" — sin foto ni precio obligatorio, se muestran diferenciados en la grilla.
  { id: 38, nombre: "Busco cuidador de perro por un fin de semana", intencion: "busco", tipo: "servicio", categoria: "oficios", subcategoria: "Cuidado de animales", zona: "Zona 2", icono: "ti-paw", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["A domicilio"], descripcion: "Viajo un fin de semana y busco alguien de confianza en la zona que pueda cuidar a mi perro en casa.", iniciales: "", tipoPublicador: "vecino", tags: ["mascotas", "perro", "cuidado"] },
  { id: 39, nombre: "Busco compra de plantines de olivo", intencion: "busco", tipo: "producto", categoria: "productores", subcategoria: "Viveros y plantines", zona: "Zona 1", icono: "ti-plant", sello: false, destacada: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Estoy armando una chacra chica y busco plantines de olivo, cantidad a definir según precio.", iniciales: "", tipoPublicador: "vecino", tags: ["olivo", "plantines", "chacra"] },
];

export const ANUNCIOS: Anuncio[] = [
  {
    id: "a1",
    tipo: "evento",
    titulo: "Feria de productores de El Doradillo",
    descripcion: "Feria mensual con productores de la zona: aceite, miel, dulces, verduras y artesanías. Entrada libre y gratuita.",
    fechaEvento: "2026-08-15",
    lugar: "Club de campo, acceso norte",
    orden: 1,
  },
  {
    id: "a2",
    tipo: "aviso_barrial",
    titulo: "Corte de luz programado en Zona 2",
    descripcion: "La cooperativa eléctrica informa un corte programado por mantenimiento el próximo martes de 9 a 13hs en Zona 2.",
    orden: 2,
  },
  {
    id: "a3",
    tipo: "promocion",
    titulo: "Ramos Generales La Estepa: 10% en compras de obra",
    descripcion: "Durante agosto, 10% de descuento en materiales de construcción comprando más de $50.000.",
    orden: 3,
  },
];
