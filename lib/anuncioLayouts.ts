// Fuente única de los 3 formatos de anuncio — usado tanto en el panel de
// admin (components/AdminClient.tsx) como en la solicitud pública
// (components/AnuncioRequestForm.tsx) para no tener las mismas líneas
// duplicadas y corriendo el riesgo de que se desincronicen.
export const ANUNCIO_LAYOUT_LABELS: Record<string, string> = {
  flyer_on_sign: "Flyer vertical (con cartel)",
  full_banner: "Foto + texto",
  text_only: "Solo texto (institucional)",
};

export const ANUNCIO_LAYOUT_OPTIONS = Object.keys(ANUNCIO_LAYOUT_LABELS);
