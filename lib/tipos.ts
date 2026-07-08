import { TipoPublicacion } from "./types";

// Fuente única del enum de Tipo — antes vivía duplicado en
// PublishWizard.tsx, HomeClient.tsx y AdminClient.tsx por separado.
export const TIPO_OPTIONS: { value: TipoPublicacion; icon: string; label: string }[] = [
  { value: "producto", icon: "ti-box", label: "Producto" },
  { value: "servicio", icon: "ti-tools", label: "Servicio" },
  { value: "experiencia", icon: "ti-compass", label: "Experiencia" },
  { value: "inmueble", icon: "ti-home", label: "Inmuebles" },
  { value: "usado", icon: "ti-recycle", label: "Usados" },
  { value: "emprendimiento", icon: "ti-building-store", label: "Emprendimiento" },
  { value: "otro", icon: "ti-dots", label: "Otro" },
];

export const TIPO_LABELS: Record<TipoPublicacion, string> = Object.fromEntries(
  TIPO_OPTIONS.map((t) => [t.value, t.label])
) as Record<TipoPublicacion, string>;
