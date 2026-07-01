"use client";

import Image from "next/image";
import { FALLBACK_COLORS } from "@/lib/data";
import { CATEGORIES } from "@/lib/data";
import { Listing } from "@/lib/types";
import { buildWhatsappLink } from "@/lib/whatsapp";

interface ListingDetailProps {
  listing: Listing | null;
  onClose: () => void;
}

export default function ListingDetail({ listing: l, onClose }: ListingDetailProps) {
  if (!l) return null;
  const listing = l;

  const fallbackColor = FALLBACK_COLORS[l.id % FALLBACK_COLORS.length];
  const isVecino = l.tipoPublicador === "vecino";
  const isNegocio = l.tipoPublicador === "negocio";
  const mapsUrl = l.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.direccion + " Puerto Madryn")}`
    : null;

  function handleContact() {
    // En producción esto registra un `whatsapp_click` server-side antes de redirigir
    // (ver ARQUITECTURA.md, sección 8). Acá es solo el link directo de demo.
    window.open(buildWhatsappLink(listing), "_blank");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Publicación</span>
          <button onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        <div
          className="relative h-60"
          style={{
            backgroundColor: l.foto ? undefined : isVecino ? "#DCD7C9" : fallbackColor,
          }}
        >
          {l.foto ? (
            <Image src={l.foto} alt={l.nombre} fill className="object-cover" sizes="480px" />
          ) : (
            <i
              className={`ti ${isVecino ? "ti-photo" : l.icono} absolute inset-0 m-auto flex h-14 w-14 items-center justify-center text-6xl ${
                isVecino ? "text-nogal/50" : "text-hueso"
              }`}
              aria-hidden
            />
          )}
        </div>

        <div className="px-5 pb-6 pt-4">
          {l.sello && (
            <Image src="/brand/sello-claro.png" alt="Selección Origen El Doradillo" width={160} height={44} className="mb-3.5 h-9 w-auto" />
          )}

          <h2 className="mb-1 font-slab text-xl font-semibold text-tinta sm:text-[22px]">{l.nombre}</h2>
          <p className="mb-1 text-[13px] text-tinta-suave">
            {CATEGORIES[l.categoria].label} · {l.subcategoria}
          </p>
          <p className="mb-3 flex items-center gap-1 text-[13.5px] font-medium text-tinta">
            <i className="ti ti-map-pin-filled text-xs" aria-hidden />
            {l.barrio || "El Doradillo"} · {l.zona}
            {l.cuadrante ? ` ${l.cuadrante}` : ""}
          </p>

          {l.direccion && (
            <p className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[13px] text-tinta">
              <i className="ti ti-map-pin" aria-hidden /> {l.direccion} · {l.zona}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-golfo">
                  Ver en Google Maps
                </a>
              )}
            </p>
          )}

          <p className="mb-3.5 text-[13px] font-semibold text-dorado">
            {l.rating > 0 ? (
              <>
                <i className="ti ti-star" aria-hidden /> {l.rating.toFixed(1)}{" "}
                <span className="font-normal text-piedra">· {l.reseñas} reseñas</span>
              </>
            ) : (
              <span className="font-normal text-piedra">Publicación nueva, todavía sin reseñas</span>
            )}
          </p>

          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {l.modalidad.map((m) => (
              <span key={m} className="rounded-full border border-piedra/70 px-2.5 py-1 text-xs font-medium text-tinta">
                {m}
              </span>
            ))}
          </div>

          {l.cantidad && (
            <p className="mb-3.5 text-[13px] text-tinta">
              <i className="ti ti-package text-sm" aria-hidden /> Disponible: {l.cantidad} unidades
            </p>
          )}

          <p className="mb-4 text-[15px] leading-relaxed text-tinta">{l.descripcion}</p>

          {isNegocio && l.colorMarca && (
            <div className="h-[38px] rounded-t-lg" style={{ backgroundColor: l.colorMarca }} />
          )}
          <div
            className={`mb-4 flex items-center gap-2.5 border border-piedra/60 bg-white p-3.5 ${
              isNegocio ? "rounded-b-lg border-t-0" : "rounded-lg"
            }`}
          >
            <div
              className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-slab text-xs font-semibold text-hueso ${isNegocio ? "-mt-6" : ""}`}
              style={{ backgroundColor: isNegocio && l.colorMarca ? l.colorMarca : "#5C3D2E" }}
            >
              {isNegocio ? <i className={`ti ${l.icono}`} aria-hidden /> : isVecino ? <i className="ti ti-user" aria-hidden /> : l.iniciales}
            </div>
            <div>
              <div className="text-sm font-semibold text-tinta">{l.nombre}</div>
              <div className="text-xs text-tinta-suave">
                {isVecino ? "Vecino verificado" : "Emprendimiento verificado"} · {l.zona}
              </div>
            </div>
          </div>

          <button
            onClick={handleContact}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-oliva py-3.5 text-[14.5px] font-semibold text-hueso"
          >
            <i className="ti ti-brand-whatsapp text-lg" aria-hidden /> Contactar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
