"use client";

import Image from "next/image";
import { fallbackColorFor } from "@/lib/data";
import { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
  onOpen: () => void;
}

export default function ListingCard({ listing: l, onOpen }: ListingCardProps) {
  const fallbackColor = fallbackColorFor(l.id);
  const isVecino = l.tipoPublicador === "vecino";
  const isNegocio = l.tipoPublicador === "negocio";
  const isDemanda = l.intencion === "busco";

  return (
    <div
      onClick={onOpen}
      className={`flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white transition-colors hover:border-oliva ${
        isDemanda ? "border-golfo/50" : "border-piedra/60"
      }`}
    >
      <div
        className="relative aspect-[4/3]"
        style={{
          backgroundColor: isDemanda
            ? "#E4EDEE"
            : l.foto
              ? undefined
              : isNegocio && l.colorMarca
                ? l.colorMarca
                : isVecino
                  ? "#DCD7C9"
                  : fallbackColor,
        }}
      >
        {isDemanda ? (
          <i className="ti ti-search absolute inset-0 m-auto flex h-9 w-9 items-center justify-center text-4xl text-golfo/70" aria-hidden />
        ) : l.foto ? (
          <Image src={l.foto} alt={l.nombre} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
        ) : (
          <i
            className={`ti ${isVecino ? "ti-photo" : l.icono} absolute inset-0 m-auto flex h-9 w-9 items-center justify-center text-4xl ${
              isVecino ? "text-nogal/55" : "text-hueso/90"
            }`}
            aria-hidden
          />
        )}

        <i
          className="ti ti-heart absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-oliva-dd/50 text-[13px] text-white"
          aria-hidden
        />

        {isDemanda ? (
          <div className="absolute left-2 top-2 rounded-full bg-golfo px-2 py-1 text-[9px] font-medium text-hueso">Busco</div>
        ) : l.sello ? (
          <Image src="/brand/sello-claro.png" alt="Selección Origen El Doradillo" width={80} height={22} className="absolute left-2 top-2 h-5 w-auto" />
        ) : l.emprendimientoDestacado ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-golfo px-2 py-1 text-[9px] font-medium text-hueso">
            <i className="ti ti-building-store text-[10px]" aria-hidden /> Emprendimiento destacado
          </div>
        ) : isVecino ? (
          <div className="absolute left-2 top-2 rounded-full bg-nogal/85 px-2 py-1 text-[9px] font-medium text-hueso">Particular</div>
        ) : null}

        <div
          className="absolute -bottom-3.5 left-2.5 flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border-2 border-white font-slab text-[10px] font-semibold text-hueso"
          style={{ backgroundColor: isNegocio && l.colorMarca ? l.colorMarca : "#5C3D2E" }}
        >
          {isNegocio ? <i className={`ti ${l.icono} text-sm`} aria-hidden /> : isVecino ? <i className="ti ti-user text-sm" aria-hidden /> : l.iniciales}
        </div>
      </div>

      <div className="flex flex-col px-3 pb-3 pt-[18px]">
        <p className="mb-1 truncate text-[10px] uppercase tracking-wide text-piedra">{l.subcategoria || "Otro"}</p>
        <h3 className="mb-0.5 line-clamp-2 min-h-[2.4em] font-slab text-sm font-semibold leading-tight text-tinta">{l.nombre}</h3>
        <p className="mb-2 truncate text-[11.5px] text-piedra">
          {l.barrio || "El Doradillo"} · {l.zona}
          {l.cuadrante ? ` ${l.cuadrante}` : ""}
        </p>
        <p className="mb-1.5 min-h-[17px] font-slab text-[13px] font-semibold text-tinta">
          {l.precioConsultar ? "A consultar" : l.precio ? `$${l.precio.toLocaleString("es-AR")}` : " "}
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
