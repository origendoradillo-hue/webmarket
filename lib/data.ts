import { Category, CategoryKey, Listing } from "./types";

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
};

// Colores de respaldo para thumbnails sin foto ni marca propia.
export const FALLBACK_COLORS = ["#4A5D3A", "#5C3D2E", "#4C6B70", "#33402A", "#8A6A3A"];

const img = (file: string) => `/images/listings/${file}`;

export const LISTINGS: Listing[] = [
  { id: 1, nombre: "Olivar Los Surcos", categoria: "productores", subcategoria: "Aceite y frutos secos", zona: "Zona 2", direccion: "Chacra 14, camino interno", cuadrante: "Norte", icono: "ti-droplet", sello: true, rating: 4.8, reseñas: 12, modalidad: ["Retiro", "Envío"], descripcion: "Aceite de oliva extra virgen prensado en frío, botellas de 500ml y 1L.", iniciales: "OS", foto: img("olivar-los-surcos.jpg"), tipoPublicador: "negocio", colorMarca: "#33402A" },
  { id: 2, nombre: "Granja Doña Rosa", categoria: "productores", subcategoria: "Huevos y aviar", zona: "Zona 1", cuadrante: "Oeste", icono: "ti-egg", sello: false, rating: 4.7, reseñas: 9, modalidad: ["Retiro"], descripcion: "Huevos de campo y pollo casero, disponibilidad recurrente todo el año.", iniciales: "DR", foto: img("granja-dona-rosa.jpg"), tipoPublicador: "productor" },
  { id: 3, nombre: "Colmenar del Golfo", categoria: "productores", subcategoria: "Miel y dulces caseros", zona: "Zona 2", direccion: "Camino a la costa", cuadrante: "Este", icono: "ti-flower", sello: true, rating: 5.0, reseñas: 6, modalidad: ["Retiro", "Envío"], descripcion: "Miel pura de estepa patagónica, cosecha propia, frascos de 500g y 1kg.", iniciales: "CG", foto: img("colmenar-del-golfo.jpg"), tipoPublicador: "productor" },
  { id: 4, nombre: "Quinta Los Aromos", categoria: "productores", subcategoria: "Verduras y quintas", zona: "Zona 3", icono: "ti-carrot", sello: false, rating: 4.5, reseñas: 8, modalidad: ["Retiro"], descripcion: "Verduras de estación cultivadas con riego de reuso, bolsón semanal.", iniciales: "LA", tipoPublicador: "productor" },
  { id: 5, nombre: "Forrajería El Establo", categoria: "productores", subcategoria: "Forrajería", zona: "Zona 1", icono: "ti-wheat", sello: false, rating: 4.6, reseñas: 14, modalidad: ["A domicilio", "Retiro"], descripcion: "Alimento balanceado, fardos y suplementos para animales de chacra.", iniciales: "EE", tipoPublicador: "productor" },
  { id: 6, nombre: "Vivero Lavanda Seca", categoria: "productores", subcategoria: "Viveros y plantines", zona: "Zona 1", direccion: "Ruta de acceso norte", cuadrante: "Norte", icono: "ti-plant", sello: true, rating: 4.7, reseñas: 9, modalidad: ["Retiro"], descripcion: "Plantines nativos, lavanda y forestación joven adaptada a la estepa.", iniciales: "VL", foto: img("vivero-lavanda-seca.jpg"), tipoPublicador: "productor" },

  { id: 7, nombre: "Panadería de Campo", categoria: "gastronomia", subcategoria: "Panadería y pastelería", zona: "Zona 2", direccion: "Chacra 22", cuadrante: "Norte", icono: "ti-bread", sello: false, rating: 4.9, reseñas: 21, modalidad: ["Retiro", "Envío"], descripcion: "Pan de masa madre y facturas, horneado a leña dos veces por semana.", iniciales: "PC", foto: img("panaderia-de-campo.jpg"), tipoPublicador: "productor" },
  { id: 8, nombre: "Viandas La Chacra", categoria: "gastronomia", subcategoria: "Comidas preparadas", zona: "Zona 3", icono: "ti-soup", sello: false, rating: 4.6, reseñas: 11, modalidad: ["A domicilio"], descripcion: "Viandas caseras semanales, menú rotativo con productos de la zona.", iniciales: "LC", tipoPublicador: "productor" },
  { id: 9, nombre: "Conservas Doña Inés", categoria: "gastronomia", subcategoria: "Dulces y conservas", zona: "Zona 1", direccion: "Chacra 9", cuadrante: "Sur", icono: "ti-jar", sello: true, rating: 5.0, reseñas: 15, modalidad: ["Retiro", "Envío"], descripcion: "Dulces artesanales y conservas en frascos, recetas de campo tradicionales.", iniciales: "DI", foto: img("conservas-dona-ines.jpg"), tipoPublicador: "productor" },
  { id: 10, nombre: "Food Truck Estepa Sur", categoria: "gastronomia", subcategoria: "Foodtrucks y eventos", zona: "Zona 3", icono: "ti-truck", sello: false, rating: 4.4, reseñas: 7, modalidad: ["A domicilio"], descripcion: "Cocina a la parrilla para eventos y celebraciones en toda la zona.", iniciales: "ES", tipoPublicador: "productor" },

  { id: 11, nombre: "Herrería El Ripio", categoria: "oficios", subcategoria: "Herrería y forja", zona: "Zona 3", icono: "ti-hammer", sello: false, rating: 4.6, reseñas: 19, modalidad: ["A domicilio", "Retiro"], descripcion: "Forja y reparación de herramientas, rejas y estructuras metálicas.", iniciales: "ER", tipoPublicador: "productor" },
  { id: 12, nombre: "Electricidad Rural Fenoglio", categoria: "oficios", subcategoria: "Electricidad", zona: "Zona 1", cuadrante: "Norte", icono: "ti-bolt", sello: false, rating: 4.8, reseñas: 16, modalidad: ["A domicilio"], descripcion: "Instalaciones eléctricas rurales, paneles solares y mantenimiento.", iniciales: "RF", foto: img("electricidad-rural-fenoglio.jpg"), tipoPublicador: "productor" },
  { id: 13, nombre: "Plomería Zona Norte", categoria: "oficios", subcategoria: "Plomería", zona: "Zona 2", icono: "ti-droplet", sello: false, rating: 4.5, reseñas: 10, modalidad: ["A domicilio"], descripcion: "Reparación de bombas de agua, cañerías y sistemas de riego.", iniciales: "ZN", tipoPublicador: "productor" },
  { id: 14, nombre: "Poda y Jardín Patagónico", categoria: "oficios", subcategoria: "Jardinería y poda", zona: "Zona 2", cuadrante: "Este", icono: "ti-scissors", sello: false, rating: 4.7, reseñas: 13, modalidad: ["A domicilio"], descripcion: "Poda de forestación joven, mantenimiento de espacios verdes en chacra.", iniciales: "JP", foto: img("poda-y-jardin-patagonico.jpg"), tipoPublicador: "productor" },
  { id: 15, nombre: "Cuidador de Animales Martín", categoria: "oficios", subcategoria: "Cuidado de animales", zona: "Zona 3", cuadrante: "Este", icono: "ti-paw", sello: false, rating: 4.9, reseñas: 22, modalidad: ["A domicilio"], descripcion: "Cuidado de animales de campo durante ausencias, visitas diarias.", iniciales: "CM", foto: img("cuidador-de-animales-martin.jpg"), tipoPublicador: "productor" },
  { id: 16, nombre: "Fletes El Doradillo", categoria: "oficios", subcategoria: "Transporte y flete", zona: "Zona 1", icono: "ti-truck-delivery", sello: false, rating: 4.6, reseñas: 18, modalidad: ["A domicilio"], descripcion: "Flete y mudanzas dentro del barrio y hacia Puerto Madryn.", iniciales: "FD", tipoPublicador: "productor" },
  { id: 17, nombre: "Limpieza de Chacras Sur", categoria: "oficios", subcategoria: "Limpieza", zona: "Zona 3", icono: "ti-spray", sello: false, rating: 4.4, reseñas: 8, modalidad: ["A domicilio"], descripcion: "Limpieza de terrenos, desmalezado y mantenimiento de parcelas.", iniciales: "CS", tipoPublicador: "productor" },

  { id: 18, nombre: "Albañilería Hnos. Coliqueo", categoria: "construccion", subcategoria: "Albañilería", zona: "Zona 2", cuadrante: "Sur", icono: "ti-brick", sello: false, rating: 4.7, reseñas: 14, modalidad: ["A domicilio"], descripcion: "Construcción y ampliaciones, presupuesto sin cargo a domicilio.", iniciales: "HC", foto: img("albanileria-hnos-coliqueo.jpg"), tipoPublicador: "productor" },
  { id: 19, nombre: "Bioconstrucción Tierra Viva", categoria: "construccion", subcategoria: "Bioconstrucción", zona: "Zona 1", icono: "ti-recycle", sello: true, rating: 4.9, reseñas: 11, modalidad: ["A domicilio"], descripcion: "Construcción en adobe y quincha, diseño bioclimático para la estepa.", iniciales: "TV", tipoPublicador: "negocio", colorMarca: "#4A3420" },
  { id: 20, nombre: "Ramos Generales La Estepa", categoria: "construccion", subcategoria: "Ferretería y ramos generales", zona: "Zona 2", direccion: "Avenida principal del barrio", icono: "ti-building-store", sello: false, rating: 4.5, reseñas: 20, modalidad: ["Retiro", "Envío"], descripcion: "Ferretería, insumos rurales y materiales para obra, todo en un lugar.", iniciales: "LE", tipoPublicador: "productor" },
  { id: 21, nombre: "Corralón El Ripio", categoria: "construccion", subcategoria: "Corralón e insumos", zona: "Zona 3", direccion: "Camino de ripio sur", icono: "ti-package", sello: false, rating: 4.4, reseñas: 9, modalidad: ["Retiro", "Envío"], descripcion: "Áridos, ladrillos y materiales de construcción con entrega en zona.", iniciales: "CR", tipoPublicador: "productor" },
  { id: 22, nombre: "Herramientas y Forja Patagonia", categoria: "construccion", subcategoria: "Herramientas", zona: "Zona 3", icono: "ti-tool", sello: false, rating: 4.6, reseñas: 12, modalidad: ["Retiro"], descripcion: "Venta y afilado de herramientas de mano para chacra y obra.", iniciales: "FP", tipoPublicador: "productor" },

  { id: 23, nombre: "Cabalgatas Estepa Norte", categoria: "turismo", subcategoria: "Cabalgatas", zona: "Zona 3", icono: "ti-horse", sello: true, rating: 5.0, reseñas: 14, modalidad: ["A domicilio"], descripcion: "Cabalgatas guiadas por la estepa al atardecer, grupos reducidos.", iniciales: "EN", tipoPublicador: "negocio", colorMarca: "#5C3D2E" },
  { id: 24, nombre: "Avistaje Doradillo", categoria: "turismo", subcategoria: "Avistaje y trekking", zona: "Zona 2", cuadrante: "Este", icono: "ti-binoculars", sello: false, rating: 4.8, reseñas: 17, modalidad: ["A domicilio"], descripcion: "Salidas de avistaje de fauna costera y trekking por el parque.", iniciales: "AD", foto: img("avistaje-doradillo.jpg"), tipoPublicador: "productor" },
  { id: 25, nombre: "Excursiones 4x4 Golfo Nuevo", categoria: "turismo", subcategoria: "Excursiones 4x4", zona: "Zona 1", icono: "ti-car", sello: false, rating: 4.6, reseñas: 10, modalidad: ["A domicilio"], descripcion: "Recorridos en 4x4 por caminos de ripio y costa del golfo.", iniciales: "GN", tipoPublicador: "productor" },
  { id: 26, nombre: "Eventos a Campo Abierto", categoria: "turismo", subcategoria: "Eventos y celebraciones", zona: "Zona 2", cuadrante: "Oeste", icono: "ti-confetti", sello: false, rating: 4.7, reseñas: 8, modalidad: ["A domicilio"], descripcion: "Organización de eventos y celebraciones en espacios de chacra.", iniciales: "CA", foto: img("eventos-a-campo-abierto.jpg"), tipoPublicador: "productor" },

  { id: 27, nombre: "Cabañas del Golfo", categoria: "hospedaje", subcategoria: "Cabañas", zona: "Zona 2", direccion: "Camino costero, km 6", icono: "ti-home", sello: true, rating: 4.9, reseñas: 31, modalidad: ["Retiro"], descripcion: "Cabañas equipadas con vista a la estepa, a minutos de la costa.", iniciales: "CG", tipoPublicador: "negocio", colorMarca: "#4C6B70" },
  { id: 28, nombre: "Hostería Refugio del Golfo", categoria: "hospedaje", subcategoria: "Hostería", zona: "Zona 2", direccion: "Camino costero, km 7", cuadrante: "Sur", icono: "ti-building", sello: false, rating: 4.8, reseñas: 24, modalidad: ["Retiro"], descripcion: "Hostería boutique con desayuno de productos locales incluido.", iniciales: "RG", foto: img("hosteria-refugio-del-golfo.jpg"), tipoPublicador: "productor" },
  { id: 29, nombre: "Camping Chacras Madryn", categoria: "hospedaje", subcategoria: "Camping", zona: "Zona 1", direccion: "Acceso norte del barrio", icono: "ti-tent", sello: false, rating: 4.5, reseñas: 19, modalidad: ["Retiro"], descripcion: "Camping con parcelas amplias, fogones y acceso a agua potable.", iniciales: "CM", tipoPublicador: "productor" },
  { id: 30, nombre: "Alquiler Temporario Norte", categoria: "hospedaje", subcategoria: "Alquiler temporario", zona: "Zona 3", icono: "ti-key", sello: false, rating: 4.6, reseñas: 13, modalidad: ["Retiro"], descripcion: "Casa de campo en alquiler temporario, ideal para estadías cortas.", iniciales: "AN", tipoPublicador: "productor" },

  { id: 31, nombre: "Lote Chacra 8ha", categoria: "inmuebles", subcategoria: "Venta de lotes y chacras", zona: "Zona 1", cuadrante: "Sur", icono: "ti-map-2", sello: false, rating: 4.9, reseñas: 5, modalidad: ["Retiro"], descripcion: "Lote de 8 hectáreas con acceso a ripio, apto forestación.", iniciales: "LC", foto: img("lote-chacra-8ha.jpg"), tipoPublicador: "productor" },
  { id: 32, nombre: "Alquiler Casa de Campo", categoria: "inmuebles", subcategoria: "Alquiler", zona: "Zona 2", icono: "ti-home-2", sello: false, rating: 4.7, reseñas: 6, modalidad: ["Retiro"], descripcion: "Casa de campo en alquiler anual, 3 dormitorios y galpón.", iniciales: "AC", tipoPublicador: "productor" },
  { id: 33, nombre: "Terreno con Mejoras Zona 2", categoria: "inmuebles", subcategoria: "Terrenos con mejoras", zona: "Zona 2", cuadrante: "Oeste", icono: "ti-fence", sello: true, rating: 5.0, reseñas: 4, modalidad: ["Retiro"], descripcion: "Terreno cercado con pozo de agua y forestación ya implantada.", iniciales: "TM", foto: img("terreno-con-mejoras-zona-2.jpg"), tipoPublicador: "productor" },

  { id: 34, nombre: "Martillos usados", categoria: "construccion", subcategoria: "Herramientas", zona: "Zona 3", icono: "ti-hammer", sello: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Vendo martillos usados en buen estado.", iniciales: "", tipoPublicador: "vecino", cantidad: 3 },
  { id: 35, nombre: "Leña seca", categoria: "construccion", subcategoria: "Corralón e insumos", zona: "Zona 1", icono: "ti-flame", sello: false, rating: 0, reseñas: 0, modalidad: ["Retiro"], descripcion: "Vendo leña seca de jarilla en bolsones de 40kg.", iniciales: "", tipoPublicador: "vecino", cantidad: 6 },
];
