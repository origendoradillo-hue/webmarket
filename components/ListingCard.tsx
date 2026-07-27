"use client";

import Image from "next/image";
import { fallbackColorFor } from "@/lib/data";
import { Listing } from "@/lib/types";
import { SITE_URL } from "@/lib/seo";
import { useShare } from "@/lib/useShare";
import SeBuscaPlaceholder from "./SeBuscaPlaceholder";

interface ListingCardProps {
  listing: Listing;
  onOpen: () => void;
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
}

export default function ListingCard({ listing: l, onOpen, isFavorito, onToggleFavorito }: ListingCardProps) {
  const fallbackColor = fallbackColorFor(l.id);
  const isVecino = l.tipoPublicador === "vecino";
  const isNegocio = l.tipoPublicador === "negocio";
  const isDemanda = l.intencion === "busco";
  // La tarjeta usa el recorte de portada (4:3) elegido aparte del de
  // detalle, si existe — si la publicación es de antes de ese cambio,
  // cae a la foto de siempre.
  const fotoCard = l.fotoPortada || l.foto;
  const { share } = useShare({
    url: l.shortCode ? `${SITE_URL}/p/${l.shortCode}` : `${SITE_URL}/publicacion/${l.id}`,
    title: l.nombre,
    text: l.descripcion.slice(0, 120),
    imageUrl: l.foto,
  });

  return (
    <div
      onClick={onOpen}
      className={`flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white transition-colors hover:border-oliva ${
        isDemanda ? "border-golfo/50" : l.destacada ? "border-dorado" : "border-piedra/60"
      }`}
    >
      {/* Fila propia para el estado/badge y los íconos, arriba de la foto
          — antes flotaban encima de la imagen y se pisaban entre sí. */}
      <div className="flex items-center justify-between gap-1 px-2 pt-2">
        <div>
          {isDemanda ? (
            <div className="rounded-full bg-golfo px-2 py-1 text-[9px] font-medium text-hueso">Busco</div>
          ) : l.sello ? (
            <Image src="/brand/sello-claro.png" alt="Selección Origen El Doradillo" width={80} height={22} className="h-5 w-auto" />
          ) : l.emprendimientoDestacado ? (
            <div className="flex items-center gap-1 rounded-full bg-golfo px-2 py-1 text-[9px] font-medium text-hueso">
              <i className="ti ti-building-store text-[10px]" aria-hidden /> Emprendimiento destacado
            </div>
          ) : l.destacada ? (
            <div className="flex items-center gap-1 rounded-full bg-dorado px-2 py-1 text-[9px] font-medium text-oliva-dd">
              <i className="ti ti-star text-[10px]" aria-hidden /> Destacada
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5">
          {onToggleFavorito && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorito();
              }}
              aria-label={isFavorito ? "Sacar de favoritos" : "Guardar en favoritos"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-tinta-suave"
            >
              <i className={`ti ti-heart ${isFavorito ? "text-dorado" : ""}`} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              share();
            }}
            aria-label="Compartir"
            className="flex h-6 items-center gap-1 rounded-full px-1.5 text-[10px] font-medium text-tinta-suave"
          >
            <i className="ti ti-share-3 text-[13px]" aria-hidden />
            Compartir
          </button>
        </div>
      </div>

      <div
        className="relative mt-1 aspect-[4/3]"
        style={{
          backgroundColor: isDemanda
            ? undefined
            : fotoCard
              ? undefined
              : isNegocio && l.colorMarca
                ? l.colorMarca
                : isVecino
                  ? "#DCD7C9"
                  : fallbackColor,
        }}
      >
        {isDemanda ? (
          <SeBuscaPlaceholder compact />
        ) : fotoCard ? (
          <Image src={fotoCard} alt={l.nombre} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
        ) : (
          <i
            className={`ti ${isVecino ? "ti-photo" : l.icono} absolute inset-0 m-auto flex h-9 w-9 items-center justify-center text-4xl ${
              isVecino ? "text-nogal/55" : "text-hueso/90"
            }`}
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-col px-3 pb-3 pt-2.5">
        <p className="mb-1 truncate text-[10px] uppercase tracking-wide text-piedra">
          {l.subcategoria || l.categoriaLabel || "Otro"}
        </p>
        <h3 className="line-clamp-2 min-h-[2.4em] font-slab text-sm font-semibold leading-tight text-tinta">{l.nombre}</h3>
        {l.subtitulo && <p className="mt-0.5 mb-1.5 truncate text-[12px] text-tinta-suave">{l.subtitulo}</p>}
        <p className="mb-0.5 truncate text-[10px] text-piedra">
          <span className="font-medium">Ubicación:</span> {l.barrio || "El Doradillo"} · {l.zona}
          {l.cuadrante ? ` ${l.cuadrante}` : ""}
        </p>
        <div className="mb-2 flex items-center gap-1.5">
          {l.publisherAvatarUrl ? (
            <span className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
              <Image src={l.publisherAvatarUrl} alt="" fill className="object-cover" sizes="20px" />
            </span>
          ) : (
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-semibold text-hueso"
              style={{ backgroundColor: isNegocio && l.colorMarca ? l.colorMarca : "#5C3D2E" }}
            >
              {isNegocio ? (
                <i className={`ti ${l.icono} text-[10px]`} aria-hidden />
              ) : isVecino ? (
                <i className="ti ti-user text-[10px]" aria-hidden />
              ) : (
                l.iniciales
              )}
            </span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-semibold text-tinta">{l.nombreEmprendimiento || l.publisherName}</p>
            {l.nombreEmprendimiento && <p className="truncate text-[10px] text-tinta-suave">de: {l.publisherName}</p>}
          </div>
        </div>
        <p className="mb-1.5 flex min-h-[19px] items-baseline gap-1.5 font-slab text-[14px] font-bold text-tinta">
          <span className="text-[10px] font-normal text-piedra">Precio:</span>
          {l.precioRegalo ? (
            "Se regala"
          ) : l.precioConsultar ? (
            "A consultar"
          ) : l.precio ? (
            <>
              {l.precioAnterior && l.precioAnterior > l.precio && (
                <span className="text-[11px] font-normal text-piedra line-through">${l.precioAnterior.toLocaleString("es-AR")}</span>
              )}
              <span className={l.precioAnterior && l.precioAnterior > l.precio ? "text-golfo" : undefined}>
                ${l.precio.toLocaleString("es-AR")}
              </span>
            </>
          ) : (
            " "
          )}
        </p>
        <p className="mb-2 min-h-[15px] truncate text-[10.5px] text-golfo">
          {l.tags && l.tags.length > 0 ? l.tags.slice(0, 3).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ") : " "}
        </p>
        <span className="mt-auto text-[11.5px] font-semibold text-dorado">
          {l.rating > 0 ? (
            <>
              <i className="ti ti-star" aria-hidden /> {l.rating.toFixed(1)}
            </>
          ) : (
            "Publicación nueva"
          )}
        </span>
      </div>
    </div>
  );
}
