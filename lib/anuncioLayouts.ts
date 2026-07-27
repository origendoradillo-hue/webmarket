// Fuente única de los 4 formatos de anuncio — usado tanto en el panel de
// admin (components/AdminClient.tsx) como en la solicitud pública
// (components/AnuncioRequestForm.tsx) para no tener las mismas 4 líneas
// duplicadas y corriendo el riesgo de que se desincronicen.
export const ANUNCIO_LAYOUT_LABELS: Record<string, string> = {
  flyer_on_sign: "Flyer vertical (con cartel)",
  full_banner: "Banner horizontal completo",
  background_image: "Imagen de fondo + placa de texto",
  text_only: "Solo texto (institucional)",
};

export const ANUNCIO_LAYOUT_OPTIONS = Object.keys(ANUNCIO_LAYOUT_LABELS);
