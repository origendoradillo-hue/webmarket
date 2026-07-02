"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, LISTINGS, ANUNCIOS } from "@/lib/data";
import { Anuncio, CategoryKey, Etiqueta, Listing, TipoPublicacion } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/mapListing";
import { mapAnuncioRow } from "@/lib/supabase/mapAnuncio";
import type { AnuncioRow, ListingRow } from "@/lib/supabase/types";
import { useAuth } from "@/lib/useAuth";
import Header from "./Header";
import Hero from "./Hero";
import CategoryFilters from "./CategoryFilters";
import HomeEntryButtons from "./HomeEntryButtons";
import TipoCategoryPicker from "./TipoCategoryPicker";
import AnuncioCarousel from "./AnuncioCarousel";
import CuratedRow from "./CuratedRow";
import ListingGrid from "./ListingGrid";
import ListingDetail from "./ListingDetail";
import MapModal from "./MapModal";
import PublishWizard from "./PublishWizard";
import AnuncioRequestForm from "./AnuncioRequestForm";
import AuthModal from "./AuthModal";
import Footer from "./Footer";

const ETIQUETAS: { value: Etiqueta; label: string }[] = [
  { value: "turismo", label: "Turismo" },
  { value: "alquileres_temporarios", label: "Alquileres temporarios" },
];

type Screen = "home" | "explorar" | "resultados";

export default function HomeClient() {
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [resultadosIntencion, setResultadosIntencion] = useState<"ofrezco" | "busco" | null>(null);
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [sub, setSub] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [intencionFilter, setIntencionFilter] = useState<"all" | "ofrezco" | "busco">("all");
  const [tipoFilter, setTipoFilter] = useState<"all" | TipoPublicacion>("all");
  const [etiquetaFilter, setEtiquetaFilter] = useState<"all" | Etiqueta>("all");
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [anuncioFormOpen, setAnuncioFormOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [realListings, setRealListings] = useState<Listing[]>([]);
  const [realAnuncios, setRealAnuncios] = useState<Anuncio[]>([]);

  const loadRealListings = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name)")
      .eq("status", "activa")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRealListings(
        (data as unknown as Array<ListingRow & { profiles: { full_name: string | null } | null }>).map((row) =>
          mapListingRow(row, row.profiles?.full_name ?? null)
        )
      );
    }
  }, []);

  const loadRealAnuncios = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("anuncios")
      .select("*")
      .eq("status", "publicado")
      .order("orden", { ascending: true });

    if (!error && data) {
      setRealAnuncios((data as AnuncioRow[]).map(mapAnuncioRow));
    }
  }, []);

  useEffect(() => {
    loadRealListings();
    loadRealAnuncios();
  }, [loadRealListings, loadRealAnuncios]);

  useEffect(() => {
    if (!user) {
      setIsStaff(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsStaff(!!data && ["moderador", "administrador", "superadmin"].includes(data.role)));
  }, [user]);

  useEffect(() => {
    if (query.trim() !== "" && screen !== "resultados") {
      setScreen("resultados");
      setResultadosIntencion(null);
    }
  }, [query, screen]);

  function resetFilters() {
    setCat("all");
    setSub("all");
    setQuery("");
    setIntencionFilter("all");
    setTipoFilter("all");
    setEtiquetaFilter("all");
    setResultadosIntencion(null);
    setScreen("home");
  }

  function handleSelectCat(next: CategoryKey | "all") {
    setCat(next);
    setSub("all");
  }

  function handleExplorar() {
    setScreen("explorar");
  }

  function handleSelectIntencion(i: "ofrezco" | "busco") {
    setIntencionFilter(i);
    setResultadosIntencion(i);
    setTipoFilter("all");
    setCat("all");
    setSub("all");
    setEtiquetaFilter("all");
    setScreen("resultados");
  }

  function handleSelectTipo(t: TipoPublicacion) {
    setTipoFilter(t);
  }

  function handleOpenPublish() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setPublishOpen(true);
  }

  function handleRequestAnuncio() {
    setPublishOpen(false);
    setAnuncioFormOpen(true);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const modalOpen = !!activeListing || mapOpen || publishOpen || anuncioFormOpen || authOpen;
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const allListings = useMemo(() => [...realListings, ...LISTINGS], [realListings]);
  const allAnuncios = useMemo(() => [...realAnuncios, ...ANUNCIOS], [realAnuncios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = allListings.filter((l) => {
      if (cat !== "all" && l.categoria !== cat) return false;
      if (sub !== "all" && l.subcategoria !== sub) return false;
      if (intencionFilter !== "all" && l.intencion !== intencionFilter) return false;
      if (tipoFilter !== "all" && l.tipo !== tipoFilter) return false;
      if (etiquetaFilter !== "all" && !(l.etiquetas || []).includes(etiquetaFilter)) return false;
      if (q) {
        const haystack = `${l.nombre} ${l.subcategoria || ""} ${l.categoria ? CATEGORIES[l.categoria].label : ""} ${(l.tags || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const score = (l: Listing) => (l.destacada ? 2 : 0) + (l.tipoPublicador === "negocio" ? 1 : 0);
      return score(b) - score(a) || b.rating - a.rating;
    });
    return result;
  }, [allListings, cat, sub, query, intencionFilter, tipoFilter, etiquetaFilter]);

  const seleccionOrigen = useMemo(() => allListings.filter((l) => l.sello), [allListings]);
  const productosRecientes = useMemo(() => allListings.filter((l) => l.tipo === "producto").slice(0, 10), [allListings]);
  const serviciosDisponibles = useMemo(() => allListings.filter((l) => l.tipo === "servicio").slice(0, 10), [allListings]);
  const usadosRecientes = useMemo(() => allListings.filter((l) => l.tipo === "usado").slice(0, 10), [allListings]);
  const herramientasDisponibles = useMemo(() => allListings.filter((l) => l.tipo === "herramienta").slice(0, 10), [allListings]);
  const busquedasActivas = useMemo(() => allListings.filter((l) => l.intencion === "busco").slice(0, 10), [allListings]);

  const showingPicker = screen === "resultados" && !!resultadosIntencion && tipoFilter === "all";

  return (
    <>
      <Header
        onOpenMap={() => setMapOpen(true)}
        onOpenPublish={handleOpenPublish}
        onLogoClick={resetFilters}
        userEmail={user?.email ?? null}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
        isStaff={isStaff}
      />
      <Hero query={query} onQueryChange={setQuery} />
      {screen === "home" && <AnuncioCarousel anuncios={allAnuncios} />}
      {screen === "home" && (
        <HomeEntryButtons
          onExplorar={handleExplorar}
          onOfrezco={() => handleSelectIntencion("ofrezco")}
          onBusco={() => handleSelectIntencion("busco")}
          onPublicar={handleOpenPublish}
        />
      )}
      {screen === "resultados" && !showingPicker && (
        <CategoryFilters cat={cat} sub={sub} onSelectCat={handleSelectCat} onSelectSub={setSub} />
      )}

      <main className="mx-auto max-w-[1240px] px-4 pb-12 sm:px-7">
        {screen === "home" && <CuratedRow title="Selección Origen" icon="ti-sparkles" listings={seleccionOrigen.slice(0, 4)} onOpen={setActiveListing} />}

        {screen === "explorar" && (
          <div className="pt-2">
            <button onClick={resetFilters} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-golfo">
              <i className="ti ti-arrow-left" aria-hidden /> Volver al inicio
            </button>
            <CuratedRow title="Selección Origen" icon="ti-sparkles" listings={seleccionOrigen} onOpen={setActiveListing} />
            <CuratedRow title="Productos recientes" icon="ti-box" listings={productosRecientes} onOpen={setActiveListing} />
            <CuratedRow title="Servicios disponibles" icon="ti-tools" listings={serviciosDisponibles} onOpen={setActiveListing} />
            <CuratedRow title="Usados recientes" icon="ti-recycle" listings={usadosRecientes} onOpen={setActiveListing} />
            <CuratedRow title="Herramientas disponibles" icon="ti-hammer" listings={herramientasDisponibles} onOpen={setActiveListing} />
            <CuratedRow title="Búsquedas activas" icon="ti-search" listings={busquedasActivas} onOpen={setActiveListing} />
          </div>
        )}

        {screen === "resultados" && (
          <div className="pt-2">
            <button onClick={resetFilters} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-golfo">
              <i className="ti ti-arrow-left" aria-hidden /> Volver al inicio
            </button>
            {showingPicker ? (
              <TipoCategoryPicker intencion={resultadosIntencion!} onSelect={handleSelectTipo} />
            ) : (
              <>
                <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setEtiquetaFilter("all")}
                    className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
                      etiquetaFilter === "all" ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
                    }`}
                  >
                    Todas las etiquetas
                  </button>
                  {ETIQUETAS.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => setEtiquetaFilter(e.value)}
                      className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
                        etiquetaFilter === e.value ? "border-dorado bg-dorado text-hueso-2" : "border-arena bg-hueso-2 text-nogal"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
                <ListingGrid listings={filtered} onOpen={setActiveListing} />
              </>
            )}
          </div>
        )}
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
          onRequestAnuncio={handleRequestAnuncio}
        />
      )}
      {user && <AnuncioRequestForm open={anuncioFormOpen} onClose={() => setAnuncioFormOpen(false)} user={user} />}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
