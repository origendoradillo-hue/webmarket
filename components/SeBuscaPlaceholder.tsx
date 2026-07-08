interface SeBuscaPlaceholderProps {
  compact?: boolean;
}

// Reemplaza el rectángulo de color liso que quedaba en las publicaciones
// "busco" sin foto — nadie sube una foto para algo que está buscando, así
// que en vez de un hueco vacío mostramos una placa ilustrada de la marca.
export default function SeBuscaPlaceholder({ compact = false }: SeBuscaPlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-hueso">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="400" height="200" fill="#F2EDE4" />
        <path d="M0 128 Q90 96 180 120 T400 104 V200 H0 Z" fill="#E4DCC8" />
        <rect x="0" y="150" width="400" height="14" fill="#4C6B70" opacity="0.18" />
        <path d="M0 166 Q110 148 210 164 T400 152 V200 H0 Z" fill="#C9A672" opacity="0.4" />
        <rect x="46" y="138" width="3" height="26" fill="#5C3D2E" opacity="0.55" />
        <rect x="64" y="143" width="3" height="21" fill="#5C3D2E" opacity="0.55" />
      </svg>

      <div className={`relative flex flex-col items-center ${compact ? "gap-1" : "gap-2 px-4 text-center"}`}>
        <div className={`flex items-center justify-center rounded-full bg-golfo/15 ${compact ? "h-8 w-8" : "h-16 w-16"}`}>
          <i className={`ti ti-search text-golfo ${compact ? "text-sm" : "text-3xl"}`} aria-hidden />
        </div>
        <h3 className={`font-slab font-semibold text-oliva-dd ${compact ? "text-[13px]" : "text-xl"}`}>Se busca</h3>
        {!compact && (
          <>
            <span className="h-[2px] w-8 rounded-full bg-dorado" />
            <p className="text-[12px] font-medium text-golfo">Publicación sin foto</p>
          </>
        )}
      </div>
    </div>
  );
}
