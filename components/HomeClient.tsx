"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, LISTINGS } from "@/lib/data";
import { CategoryKey, Listing } from "@/lib/types";
import Header from "./Header";
import Hero from "./Hero";
import CategoryFilters from "./CategoryFilters";
import ListingGrid from "./ListingGrid";
import ListingDetail from "./ListingDetail";
import MapModal from "./MapModal";
import PublishWizard from "./PublishWizard";
import Footer from "./Footer";

export default function HomeClient() {
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [sub, setSub] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  function resetFilters() {
    setCat("all");
    setSub("all");
    setQuery("");
  }

  function handleSelectCat(next: CategoryKey | "all") {
    setCat(next);
    setSub("all");
  }

  const modalOpen = !!activeListing || mapOpen || publishOpen;
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = LISTINGS.filter((l) => {
      if (cat !== "all" && l.categoria !== cat) return false;
      if (sub !== "all" && l.subcategoria !== sub) return false;
      if (q) {
        const haystack = `${l.nombre} ${l.subcategoria} ${CATEGORIES[l.categoria].label}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const score = (l: Listing) => (l.tipoPublicador === "negocio" ? 1 : 0);
      return score(b) - score(a) || b.rating - a.rating;
    });
    return result;
  }, [cat, sub, query]);

  return (
    <>
      <Header onOpenMap={() => setMapOpen(true)} onOpenPublish={() => setPublishOpen(true)} onLogoClick={resetFilters} />
      <Hero query={query} onQueryChange={setQuery} />
      <CategoryFilters cat={cat} sub={sub} onSelectCat={handleSelectCat} onSelectSub={setSub} />
      <main className="mx-auto max-w-[1240px] px-4 pb-12 sm:px-7">
        <ListingGrid listings={filtered} onOpen={setActiveListing} />
      </main>
      <Footer />

      <ListingDetail listing={activeListing} onClose={() => setActiveListing(null)} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <PublishWizard open={publishOpen} onClose={() => setPublishOpen(false)} />
    </>
  );
}
