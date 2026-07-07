"use client";

import { useRef } from "react";
import { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface CuratedRowProps {
  title: string;
  icon?: string;
  listings: Listing[];
  onOpen: (l: Listing) => void;
}

export default function CuratedRow({ title, icon, listings, onOpen }: CuratedRowProps) {
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
              <ListingCard listing={l} onOpen={() => onOpen(l)} />
            </div>
          ))}
        </div>

        {listings.length > 2 && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-440)}
              aria-label={`${title}: anterior`}
              className="absolute -left-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-piedra/50 bg-white text-tinta opacity-70 shadow-md transition-opacity hover:opacity-100 hover:bg-hueso-2 lg:flex"
            >
              <i className="ti ti-chevron-left text-lg" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(440)}
              aria-label={`${title}: siguiente`}
              className="absolute -right-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-piedra/50 bg-white text-tinta opacity-70 shadow-md transition-opacity hover:opacity-100 hover:bg-hueso-2 lg:flex"
            >
              <i className="ti ti-chevron-right text-lg" aria-hidden />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
