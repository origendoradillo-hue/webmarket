export const REPORT_MOTIVO_LABELS: Record<string, string> = {
  informacion_falsa: "Información falsa o engañosa",
  producto_no_disponible: "Producto no disponible",
  precio_no_coincide: "Precio o condiciones no coinciden",
  publicador_no_responde: "Publicador no responde",
  sospecha_estafa: "Sospecha de estafa",
  contenido_inapropiado: "Contenido inapropiado",
  categoria_incorrecta: "Categoría incorrecta",
  publicacion_duplicada: "Publicación duplicada",
  fotos_falsas: "Fotos falsas o robadas",
  insultos_agravios: "Insultos o agravios",
  otro: "Otro",
};

// Motivos que, si se confirman, habilitan suspender tanto al denunciado como
// al denunciante (hoy solo insultos/agravios) — un solo lugar para agregar
// otro motivo con el mismo tratamiento en el futuro.
const MOTIVOS_SUSPENSION_RECIPROCA = new Set<string>(["insultos_agravios"]);

export function requiereSuspensionReciproca(motivo: string): boolean {
  return MOTIVOS_SUSPENSION_RECIPROCA.has(motivo);
}
