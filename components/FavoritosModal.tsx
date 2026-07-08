"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/useCategories";
import { mapListingRow } from "@/lib/supabase/mapListing";
import type { ListingRow } from "@/lib/supabase/types";
import { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface FavoritosModalProps {
  open: boolean;
  onClose: () => void;
  favoritoIds: Set<string>;
  onToggleFavorito: (id: string) => void;
  onOpenListing: (l: Listing) => void;
}

export default function FavoritosModal({ open, onClose, favoritoIds, onToggleFavorito, onOpenListing }: FavoritosModalProps) {
  const { categories } = useCategories();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavoritos = useCallback(async () => {
    setLoading(true);
    const ids = Array.from(favoritoIds);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select(
        "*, profiles!listings_publisher_id_fkey(full_name, nickname, rating_promedio, resenas_count, instagram_url, facebook_url)"
      )
      .in("id", ids)
      .eq("status", "activa");
    const rows =
      (data as unknown as Array<
        ListingRow & {
          profiles: {
            full_name: string | null;
            nickname: string | null;
            rating_promedio: number | null;
            resenas_count: number;
            instagram_url: string | null;
            facebook_url: string | null;
          } | null;
        }
      >) || [];
    setListings(rows.map((row) => mapListingRow(row, row.profiles, categories)));
    setLoading(false);
  }, [favoritoIds, categories]);

  useEffect(() => {
    if (open) loadFavoritos();
  }, [open, loadFavoritos]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Mis favoritos</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">Cargando...</p>
          ) : listings.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-tinta-suave">
              Todavía no guardaste ninguna publicación como favorita — tocá el corazón en cualquier publicación para
              guardarla acá.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onOpen={() => {
                    onClose();
                    onOpenListing(l);
                  }}
                  isFavorito
                  onToggleFavorito={() => onToggleFavorito(String(l.id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
