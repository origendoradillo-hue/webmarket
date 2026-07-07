"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LISTINGS, ANUNCIOS } from "@/lib/data";
import { useCategories } from "@/lib/useCategories";
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
import ProfileModal from "./ProfileModal";
import MyListingsModal from "./MyListingsModal";
import ForcePasswordModal from "./ForcePasswordModal";
import ReportListingModal from "./ReportListingModal";
import ReviewModal from "./ReviewModal";
import Footer from "./Footer";

const ETIQUETAS: { value: Etiqueta; label: string }[] = [
  { value: "turismo", label: "Turismo" },
  { value: "alquileres_temporarios", label: "Alquileres temporarios" },
];

type Screen = "home" | "explorar" | "resultados";

export default function HomeClient() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [isStaff, setIsStaff] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [blocked, setBlocked] = useState(false);
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
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [profileOpen, setProfileOpen] = useState(false);
  const [myListingsOpen, setMyListingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewListingId, setReviewListingId] = useState<string | null>(null);
  const [reviewReminder, setReviewReminder] = useState<{ listingId: string; nombre: string } | null>(null);
  const [realListings, setRealListings] = useState<Listing[]>([]);
  const [realAnuncios, setRealAnuncios] = useState<Anuncio[]>([]);

  const loadRealListings = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name, nickname, rating_promedio, resenas_count)")
      .eq("status", "activa")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRealListings(
        (
          data as unknown as Array<
            ListingRow & {
              profiles: { full_name: string | null; nickname: string | null; rating_promedio: number | null; resenas_count: number } | null;
            }
          >
        ).map((row) => mapListingRow(row, row.profiles, categories))
      );
    }
  }, [categories]);

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

  const loadReviewReminder = useCallback(async () => {
    if (!user) {
      setReviewReminder(null);
      return;
    }
    const supabase = createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: clicks } = await supabase
      .from("whatsapp_clicks")
      .select("listing_id, created_at, listings(nombre)")
      .eq("clicked_by", user.id)
      .lt("created_at", since)
      .order("created_at", { ascending: false });
    const clickRows = (clicks as unknown as Array<{ listing_id: string; listings: { nombre: string } | null }>) || [];
    if (clickRows.length === 0) {
      setReviewReminder(null);
      return;
    }
    const { data: myReviews } = await supabase.from("reviews").select("listing_id").eq("reviewer_id", user.id);
    const reviewedIds = new Set((myReviews || []).map((r) => r.listing_id));
    const pending = clickRows.find((c) => !reviewedIds.has(c.listing_id));
    setReviewReminder(pending ? { listingId: pending.listing_id, nombre: pending.listings?.nombre ?? "esa publicación" } : null);
  }, [user]);

  useEffect(() => {
    loadRealListings();
    loadRealAnuncios();
  }, [loadRealListings, loadRealAnuncios]);

  useEffect(() => {
    loadReviewReminder();
  }, [loadReviewReminder]);

  useEffect(() => {
    if (window.location.search.includes("reset=1")) {
      setAuthMode("reset");
      setAuthOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsStaff(false);
      setMustChangePassword(false);
      setBlocked(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role, must_change_password, blocked_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsStaff(!!data && ["admin", "superadmin"].includes(data.role));
        setMustChangePassword(!!data?.must_change_password);
        setBlocked(!!data?.blocked_at);
      });
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

  function openAuth() {
    setAuthMode("login");
    setAuthOpen(true);
  }

  function handleOpenPublish() {
    if (!user) {
      openAuth();
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

  const modalOpen =
    !!activeListing ||
    mapOpen ||
    publishOpen ||
    anuncioFormOpen ||
    authOpen ||
    profileOpen ||
    myListingsOpen ||
    reportOpen ||
    !!reviewListingId;
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const allListings = useMemo(() => [...realListings, ...LISTINGS], [realListings]);
  const allAnuncios = useMemo(() => [...realAnuncios, ...ANUNCIOS], [realAnuncios]);
  const anunciosHome = useMemo(() => allAnuncios.filter((a) => a.ubicacion === "home" || a.ubicacion === "ambas"), [allAnuncios]);
  const anunciosCategoria = useMemo(
    () => allAnuncios.filter((a) => a.ubicacion === "categoria" || a.ubicacion === "ambas"),
    [allAnuncios]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = allListings.filter((l) => {
      if (cat !== "all" && l.categoria !== cat) return false;
      if (sub !== "all" && l.subcategoria !== sub) return false;
      if (intencionFilter !== "all" && l.intencion !== intencionFilter) return false;
      if (tipoFilter !== "all" && l.tipo !== tipoFilter) return false;
      if (etiquetaFilter !== "all" && !(l.etiquetas || []).includes(etiquetaFilter)) return false;
      if (q) {
        const haystack = `${l.nombre} ${l.subcategoria || ""} ${l.categoria ? categories[l.categoria]?.label || "" : ""} ${(l.tags || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const score = (l: Listing) => (l.destacada ? 2 : 0) + (l.tipoPublicador === "negocio" ? 1 : 0);
      return score(b) - score(a) || b.rating - a.rating;
    });
    return result;
  }, [allListings, cat, sub, query, intencionFilter, tipoFilter, etiquetaFilter, categories]);

  const seleccionOrigen = useMemo(() => allListings.filter((l) => l.sello), [allListings]);
  const destacados = useMemo(() => allListings.filter((l) => l.destacada), [allListings]);
  const productosRecientes = useMemo(() => allListings.filter((l) => l.tipo === "producto").slice(0, 10), [allListings]);
  const serviciosDisponibles = useMemo(() => allListings.filter((l) => l.tipo === "servicio").slice(0, 10), [allListings]);
  const usadosRecientes = useMemo(() => allListings.filter((l) => l.tipo === "usado").slice(0, 10), [allListings]);
  const herramientasDisponibles = useMemo(() => allListings.filter((l) => l.tipo === "herramienta").slice(0, 10), [allListings]);
  const busquedasActivas = useMemo(() => allListings.filter((l) => l.intencion === "busco").slice(0, 10), [allListings]);

  const showingPicker = screen === "resultados" && !!resultadosIntencion && tipoFilter === "all";

  if (user && blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-oliva-dd px-6 text-center">
        <i className="ti ti-lock text-4xl text-dorado" aria-hidden />
        <p className="font-slab text-lg font-semibold text-hueso">Tu cuenta fue bloqueada</p>
        <p className="max-w-sm text-[13px] text-hueso/80">
          Si creés que es un error, escribinos a origendoradillo@gmail.com.
        </p>
        <button onClick={handleSignOut} className="rounded-lg bg-dorado px-5 py-2.5 text-[13.5px] font-semibold text-oliva-dd">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <>
      <Header
        onOpenMap={() => setMapOpen(true)}
        onOpenPublish={handleOpenPublish}
        onLogoClick={resetFilters}
        userEmail={user?.email ?? null}
        onOpenAuth={openAuth}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenMyListings={() => setMyListingsOpen(true)}
        onSignOut={handleSignOut}
        isStaff={isStaff}
      />
      {reviewReminder && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-dorado/15 px-4 py-2.5 text-[12.5px] text-tinta sm:px-8">
          <span>
            <i className="ti ti-message-circle mr-1.5 text-dorado" aria-hidden />
            ¿Pudiste comunicarte con quien publicó <strong>{reviewReminder.nombre}</strong>?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewListingId(reviewReminder.listingId)}
              className="rounded-lg bg-dorado px-3 py-1.5 text-[12px] font-semibold text-oliva-dd"
            >
              Sí, pude
            </button>
            <button onClick={() => setReviewReminder(null)} className="rounded-lg border border-piedra/60 px-3 py-1.5 text-[12px] text-tinta">
              No pude
            </button>
          </div>
        </div>
      )}
      <Hero query={query} onQueryChange={setQuery} />
      {screen === "home" && <AnuncioCarousel anuncios={anunciosHome} />}
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
        {screen === "home" && (
          <>
            <CuratedRow title="Selección Origen" icon="ti-sparkles" listings={seleccionOrigen.slice(0, 4)} onOpen={setActiveListing} />
            <CuratedRow title="Productos destacados" icon="ti-star" listings={destacados.slice(0, 4)} onOpen={setActiveListing} />
          </>
        )}

        {screen === "explorar" && (
          <div className="pt-2">
            <button onClick={resetFilters} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-golfo">
              <i className="ti ti-arrow-left" aria-hidden /> Volver al inicio
            </button>
            {anunciosCategoria.length > 0 && (
              <div className="-mx-4 mb-4 sm:-mx-7">
                <AnuncioCarousel anuncios={anunciosCategoria} />
              </div>
            )}
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
            {anunciosCategoria.length > 0 && (
              <div className="-mx-4 mb-4 sm:-mx-7">
                <AnuncioCarousel anuncios={anunciosCategoria} />
              </div>
            )}
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
        user={user}
        onRequireAuth={openAuth}
        onReport={() => setReportOpen(true)}
        onReview={() => setReviewListingId(activeListing ? String(activeListing.id) : null)}
      />
      {user && activeListing?.isReal && (
        <ReportListingModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          listingId={String(activeListing.id)}
          user={user}
        />
      )}
      {user && reviewListingId && (
        <ReviewModal
          open={!!reviewListingId}
          onClose={() => setReviewListingId(null)}
          listingId={reviewListingId}
          user={user}
          onSubmitted={() => {
            setReviewReminder(null);
            loadRealListings();
          }}
        />
      )}
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
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
      {user && <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />}
      {user && (
        <MyListingsModal
          open={myListingsOpen}
          onClose={() => {
            setMyListingsOpen(false);
            loadRealListings();
          }}
          user={user}
        />
      )}
      {user && <ForcePasswordModal open={mustChangePassword} user={user} onDone={() => setMustChangePassword(false)} />}
    </>
  );
}
