// Paneles de vista previa para PhotoCropModal al recortar la foto de
// portada de una publicación — se muestra en dos formatos distintos
// (tarjeta 4:3 vs. detalle 4:5), así que se recorta a 4:5 (el más
// completo) y acá se ve, en vivo, cómo queda en cada uno.
export const LISTING_COVER_PREVIEW_PANELS = [
  {
    label: "Al abrir la publicación",
    render: (url: string) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="aspect-[4/5] w-16 rounded object-cover" />
    ),
  },
  {
    label: "En la portada",
    render: (url: string) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="aspect-[4/3] w-20 rounded object-cover" />
    ),
  },
];
