"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, LISTINGS } from "@/lib/data";
import { CategoryKey, Listing } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/mapListing";
import type { ListingRow } from "@/lib/supabase/types";
import { useAuth } from "@/lib/useAuth";
import Header from "./Header";
import Hero from "./Hero";
import CategoryFilters from "./CategoryFilters";
import ListingGrid from "./ListingGrid";
import ListingDetail from "./ListingDetail";
import MapModal from "./MapModal";
import PublishWizard from "./PublishWizard";
import AuthModal from "./AuthModal";
import Footer from "./Footer";

export default function HomeClient() {
  const { user } = useAuth();
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [sub, setSub] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [realListings, setRealListings] = useState<Listing[]>([]);

  const loadRealListings = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name)")
      .eq("status", "publicada")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRealListings(
        (data as unknown as Array<ListingRow & { profiles: { full_name: string | null } | null }>).map((row) =>
          mapListingRow(row, row.profiles?.full_name ?? null)
        )
      );
    }
  }, []);

  useEffect(() => {
    loadRealListings();
  }, [loadRealListings]);

  function resetFilters() {
    setCat("all");
    setSub("all");
    setQuery("");
  }

  function handleSelectCat(next: CategoryKey | "all") {
    setCat(next);
    setSub("all");
  }

  function handleOpenPublish() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setPublishOpen(true);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const modalOpen = !!activeListing || mapOpen || publishOpen || authOpen;
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const allListings = useMemo(() => [...realListings, ...LISTINGS], [realListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = allListings.filter((l) => {
      if (cat !== "all" && l.categoria !== cat) return false;
      if (sub !== "all" && l.subcategoria !== sub) return false;
      if (q) {
        const haystack = `${l.nombre} ${l.subcategoria} ${CATEGORIES[l.categoria].label} ${(l.tags || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const score = (l: Listing) => (l.tipoPublicador === "negocio" ? 1 : 0);
      return score(b) - score(a) || b.rating - a.rating;
    });
    return result;
  }, [allListings, cat, sub, query]);

  return (
    <>
      <Header
        onOpenMap={() => setMapOpen(true)}
        onOpenPublish={handleOpenPublish}
        onLogoClick={resetFilters}
        userEmail={user?.email ?? null}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />
      <Hero query={query} onQueryChange={setQuery} />
      <CategoryFilters cat={cat} sub={sub} onSelectCat={handleSelectCat} onSelectSub={setSub} />
      <main className="mx-auto max-w-[1240px] px-4 pb-12 sm:px-7">
        <ListingGrid listings={filtered} onOpen={setActiveListing} />
      </main>
      <Footer />

      <ListingDetail
        listing={activeListing}
        onClose={() => setActiveListing(null)}
        isLoggedIn={!!user}
        onRequireAuth={() => setAuthOpen(true)}
      />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      {user && (
        <PublishWizard
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          user={user}
          onPublished={loadRealListings}
        />
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
