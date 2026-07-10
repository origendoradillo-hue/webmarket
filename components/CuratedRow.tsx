"use client";

import { useRef } from "react";
import { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface CuratedRowProps {
  title: string;
  icon?: string;
  listings: Listing[];
  onOpen: (l: Listing) => void;
  favoritoIds?: Set<string>;
  onToggleFavorito?: (id: string) => void;
}

export default function CuratedRow({ title, icon, listings, onOpen, favoritoIds, onToggleFavorito }: CuratedRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (listings.length === 0) return null;

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="py-5">
      <h2 className="mb-3 flex items-center gap-2 font-slab text-base font-semibold text-tinta">
        {icon && <i className={`ti ${icon} text-oliva`} aria-hidden />}
        {title}
      </h2>
      <div className="relative">
        <div ref={scrollerRef} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1">
          {listings.map((l) => (
            <div key={l.id} className="w-[210px] flex-shrink-0">
              <ListingCard
                listing={l}
                onOpen={() => onOpen(l)}
                isFavorito={favoritoIds?.has(String(l.id))}
                onToggleFavorito={onToggleFavorito ? () => onToggleFavorito(String(l.id)) : undefined}
              />
            </div>
          ))}
        </div>

        {listings.length > 2 && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-440)}
              aria-label={`${title}: anterior`}
              className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 sm:-left-4 sm:h-9 sm:w-9 sm:border sm:border-piedra/50 sm:bg-white sm:text-tinta sm:opacity-70 sm:shadow-md sm:hover:bg-hueso-2"
            >
              <i className="ti ti-chevron-left text-lg" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(440)}
              aria-label={`${title}: siguiente`}
              className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 sm:-right-4 sm:h-9 sm:w-9 sm:border sm:border-piedra/50 sm:bg-white sm:text-tinta sm:opacity-70 sm:shadow-md sm:hover:bg-hueso-2"
            >
              <i className="ti ti-chevron-right text-lg" aria-hidden />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
