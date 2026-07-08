"use client";

import { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface ListingGridProps {
  listings: Listing[];
  onOpen: (listing: Listing) => void;
  favoritoIds?: Set<string>;
  onToggleFavorito?: (id: string) => void;
}

export default function ListingGrid({ listings, onOpen, favoritoIds, onToggleFavorito }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center text-piedra">
        No hay publicaciones para este filtro todavía.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          onOpen={() => onOpen(l)}
          isFavorito={favoritoIds?.has(String(l.id))}
          onToggleFavorito={onToggleFavorito ? () => onToggleFavorito(String(l.id)) : undefined}
        />
      ))}
    </div>
  );
}
