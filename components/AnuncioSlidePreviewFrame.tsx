"use client";

// Antes las vistas previas (grilla de 4 formatos, panel "Así se ve" del
// editor de recorte) metían el AnuncioSlide real en una caja fija más
// chica (220x220) — como el texto y el padding de AnuncioSlide están en
// píxeles fijos, no se achican con la caja: quedaban amontonados o
// cortados, no una versión en miniatura de cómo se ve en el celular.
// Este wrapper renderiza el slide a su tamaño real (el mismo ancho/alto
// que usa AnuncioCarousel en mobile) y lo escala entero con CSS
// transform, como si fuera una foto — así toda la vista previa guarda
// la misma proporción que el anuncio publicado, sea cual sea el ancho
// de la caja donde se muestra.
const NATIVE_WIDTH = 375;
const NATIVE_HEIGHT = 360;

export default function AnuncioSlidePreviewFrame({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ containerType: "inline-size", aspectRatio: `${NATIVE_WIDTH} / ${NATIVE_HEIGHT}` }}
    >
      <div
        style={{
          width: NATIVE_WIDTH,
          height: NATIVE_HEIGHT,
          transform: `scale(calc(100cqw / ${NATIVE_WIDTH}px))`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
