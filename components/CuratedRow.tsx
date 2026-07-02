"use client";

import { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface CuratedRowProps {
  title: string;
  icon?: string;
  listings: Listing[];
  onOpen: (l: Listing) => void;
}

export default function CuratedRow({ title, icon, listings, onOpen }: CuratedRowProps) {
  if (listings.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="mb-3 flex items-center gap-2 font-slab text-base font-semibold text-tinta">
        {icon && <i className={`ti ${icon} text-oliva`} aria-hidden />}
        {title}
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {listings.map((l) => (
          <div key={l.id} className="w-[210px] flex-shrink-0">
            <ListingCard listing={l} onOpen={() => onOpen(l)} />
          </div>
        ))}
      </div>
    </section>
  );
}
