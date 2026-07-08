"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCategories } from "@/lib/useCategories";
import { Anuncio, CategoryKey, Etiqueta, Listing, TipoPublicacion } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/mapListing";
import { mapAnuncioRow } from "@/lib/supabase/mapAnuncio";
import type { AnuncioRow, ListingRow } from "@/lib/supabase/types";
import { useAuth } from "@/lib/useAuth";
import { trackEvent } from "@/lib/analytics";
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
import FavoritosModal from "./FavoritosModal";
import ForcePasswordModal from "./ForcePasswordModal";
import ReportListingModal from "./ReportListingModal";
import ReviewModal from "./ReviewModal";
import Footer from "./Footer";

const ETIQUETAS: { value: Etiqueta; label: string }[] = [
  { value: "turismo", label: "Turismo" },
  { value: "alquileres_temporarios", label: "Alquileres temporarios" },
];

// El recordatorio de reseña no debe ser cargoso: se recuerda qué contactos ya
// se descartaron (para no volver a preguntar por el mismo) y solo se muestra
// una parte de las veces que corresponde, no siempre.
const REVIEW_REMINDER_DISMISSED_KEY = "origen_review_reminder_dismissed";

function getDismissedReviewReminders(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_REMINDER_DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismissReviewReminder(listingId: string) {
  try {
    const current = getDismissedReviewReminders();
    localStorage.setItem(REVIEW_REMINDER_DISMISSED_KEY, JSON.stringify([...current, listingId]));
  } catch {
    // localStorage no disponible en este navegador — el recordatorio puede repetirse, no es grave.
  }
}

const TIPO_LABELS: Record<TipoPublicacion, string> = {
  producto: "Productos",
  servicio: "Servicios",
  experiencia: "Experiencias",
  inmueble: "Inmuebles",
  usado: "Usados",
  emprendimiento: "Emprendimientos",
  otro: "Otros",
};

type Screen = "home" | "explorar" | "resultados";

export default function HomeClient() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [isStaff, setIsStaff] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
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
  const [favoritosOpen, setFavoritosOpen] = useState(false);
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ listingId: string; listingNombre: string; publisherName?: string } | null>(null);
  const [reviewReminder, setReviewReminder] = useState<{ listingId: string; nombre: string; publisherName: string } | null>(null);
  const [expiryReminder, setExpiryReminder] = useState<{ nombre: string; diasRestantes: number } | null>(null);
  const [realListings, setRealListings] = useState<Listing[]>([]);
  const [realAnuncios, setRealAnuncios] = useState<Anuncio[]>([]);

  const loadRealListings = useCallback(async () => {
    const supabase = createClient();
    // expire_old_listings hace un update en toda la tabla; no hay cron
    // disponible así que se llama desde acá, pero alcanza con chequearlo una
    // vez cada pocos minutos por pestaña en vez de en cada carga/recarga.
    try {
      const lastCheck = Number(sessionStorage.getItem("origen_expire_checked_at") || 0);
      if (Date.now() - lastCheck > 5 * 60 * 1000) {
        await supabase.rpc("expire_old_listings");
        sessionStorage.setItem("origen_expire_checked_at", String(Date.now()));
      }
    } catch {
      await supabase.rpc("expire_old_listings");
    }
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name, nickname, rating_promedio, resenas_count, instagram_url, facebook_url)")
      .eq("status", "activa")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRealListings(
        (
          data as unknown as Array<
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
      .select("listing_id, created_at, listings(nombre, publisher_id, profiles(full_name, nickname))")
      .eq("clicked_by", user.id)
      .lt("created_at", since)
      .order("created_at", { ascending: false });
    const clickRows =
      (clicks as unknown as Array<{
        listing_id: string;
        listings: { nombre: string; publisher_id: string; profiles: { full_name: string | null; nickname: string | null } | null } | null;
      }>) || [];
    if (clickRows.length === 0) {
      setReviewReminder(null);
      return;
    }
    const { data: myReviews } = await supabase.from("reviews").select("listing_id").eq("reviewer_id", user.id);
    const reviewedIds = new Set((myReviews || []).map((r) => r.listing_id));
    const dismissed = new Set(getDismissedReviewReminders());
    const pending = clickRows.find(
      (c) => !reviewedIds.has(c.listing_id) && !dismissed.has(c.listing_id) && c.listings?.publisher_id !== user.id
    );
    // No siempre — para que no sea cargoso, solo se muestra una parte de las veces.
    if (pending && Math.random() < 0.5) {
      setReviewReminder({
        listingId: pending.listing_id,
        nombre: pending.listings?.nombre ?? "esa publicación",
        publisherName: pending.listings?.profiles?.nickname?.trim() || pending.listings?.profiles?.full_name?.trim() || "esa persona",
      });
    } else {
      setReviewReminder(null);
    }
  }, [user]);

  const loadExpiryReminder = useCallback(async () => {
    if (!user) {
      setExpiryReminder(null);
      return;
    }
    const supabase = createClient();
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("listings")
      .select("nombre, expires_at")
      .eq("publisher_id", user.id)
      .in("status", ["activa", "vencida"])
      .not("expires_at", "is", null)
      .lt("expires_at", soon)
      .order("expires_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data || !data.expires_at) {
      setExpiryReminder(null);
      return;
    }
    const diasRestantes = Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    setExpiryReminder({ nombre: data.nombre, diasRestantes });
  }, [user]);

  const loadFavoritos = useCallback(async () => {
    if (!user) {
      setFavoritoIds(new Set());
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.from("favoritos").select("listing_id").eq("user_id", user.id);
    setFavoritoIds(new Set((data || []).map((f) => f.listing_id)));
  }, [user]);

  async function toggleFavorito(listingId: string) {
    if (!user) {
      openAuth();
      return;
    }
    const supabase = createClient();
    const isFavorito = favoritoIds.has(listingId);
    setFavoritoIds((prev) => {
      const next = new Set(prev);
      if (isFavorito) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    if (isFavorito) {
      await supabase.from("favoritos").delete().eq("user_id", user.id).eq("listing_id", listingId);
    } else {
      await supabase.from("favoritos").insert({ user_id: user.id, listing_id: listingId });
    }
  }

  useEffect(() => {
    loadRealListings();
    loadRealAnuncios();
  }, [loadRealListings, loadRealAnuncios]);

  useEffect(() => {
    async function registrarVisita() {
      const supabase = createClient();
      await supabase.rpc("registrar_visita_sitio");
    }
    registrarVisita();
  }, []);

  useEffect(() => {
    loadReviewReminder();
    loadExpiryReminder();
    loadFavoritos();
  }, [loadReviewReminder, loadExpiryReminder, loadFavoritos]);

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
      setProfileComplete(true);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role, must_change_password, blocked_at, full_name, whatsapp_number")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsStaff(!!data && ["admin", "superadmin"].includes(data.role));
        setMustChangePassword(!!data?.must_change_password);
        setBlocked(!!data?.blocked_at);
        setProfileComplete(!!data?.full_name?.trim() && !!data?.whatsapp_number?.trim());
      });
  }, [user]);

  function handleSearchSubmit() {
    if (query.trim() === "") return;
    trackEvent("search", { search_term: query.trim() });
    setScreen("resultados");
    setResultadosIntencion(null);
  }

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
    setResultadosIntencion(null);
    setIntencionFilter("all");
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
    if (!profileComplete) {
      alert('Te falta completar tu nombre y/o WhatsApp en "Mi perfil" antes de poder publicar.');
      setProfileOpen(true);
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
    !!reviewTarget;
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const allListings = realListings;
  const anunciosHome = useMemo(() => realAnuncios.filter((a) => a.ubicacion === "home" || a.ubicacion === "ambas"), [realAnuncios]);
  const anunciosCategoria = useMemo(
    () => realAnuncios.filter((a) => a.ubicacion === "categoria" || a.ubicacion === "ambas"),
    [realAnuncios]
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
  const emprendimientosDestacados = useMemo(() => allListings.filter((l) => l.tipo === "emprendimiento").slice(0, 10), [allListings]);
  const busquedasActivas = useMemo(() => allListings.filter((l) => l.intencion === "busco").slice(0, 10), [allListings]);

  const showingPicker = screen === "resultados" && !!resultadosIntencion && tipoFilter === "all";

  const breadcrumb = useMemo(() => {
    if (screen === "explorar") return "Explorando todo";
    const parts: string[] = [];
    if (resultadosIntencion === "ofrezco") parts.push("Se ofrece");
    else if (resultadosIntencion === "busco") parts.push("Se busca");
    if (tipoFilter !== "all") parts.push(TIPO_LABELS[tipoFilter]);
    if (cat !== "all" && categories[cat]) parts.push(categories[cat].label);
    if (sub !== "all") parts.push(sub);
    return parts.length > 0 ? parts.join(" → ") : "Resultados";
  }, [screen, resultadosIntencion, tipoFilter, cat, sub, categories]);

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
        onOpenFavoritos={() => setFavoritosOpen(true)}
        onSignOut={handleSignOut}
        isStaff={isStaff}
      />
      {expiryReminder && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-red-50 px-4 py-2.5 text-[12.5px] text-tinta sm:px-8">
          <span>
            <i className="ti ti-clock-exclamation mr-1.5 text-red-700" aria-hidden />
            {expiryReminder.diasRestantes > 0 ? (
              <>
                Tu publicación <strong>{expiryReminder.nombre}</strong> vence en {expiryReminder.diasRestantes} día
                {expiryReminder.diasRestantes === 1 ? "" : "s"}.
              </>
            ) : (
              <>
                Tu publicación <strong>{expiryReminder.nombre}</strong> ya venció.
              </>
            )}
          </span>
          <button onClick={() => setMyListingsOpen(true)} className="rounded-lg bg-red-700 px-3 py-1.5 text-[12px] font-semibold text-hueso">
            Renovar
          </button>
        </div>
      )}
      {reviewReminder && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-dorado/15 px-4 py-2.5 text-[12.5px] text-tinta sm:px-8">
          <span>
            <i className="ti ti-message-circle mr-1.5 text-dorado" aria-hidden />
            ¿Pudiste comunicarte con <strong>{reviewReminder.publisherName}</strong>? Fue por tu contacto sobre{" "}
            <em className="not-italic text-tinta-suave">{reviewReminder.nombre}</em>.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setReviewTarget({
                  listingId: reviewReminder.listingId,
                  listingNombre: reviewReminder.nombre,
                  publisherName: reviewReminder.publisherName,
                })
              }
              className="rounded-lg bg-dorado px-3 py-1.5 text-[12px] font-semibold text-oliva-dd"
            >
              Sí, pude
            </button>
            <button
              onClick={() => {
                dismissReviewReminder(reviewReminder.listingId);
                setReviewReminder(null);
              }}
              className="rounded-lg border border-piedra/60 px-3 py-1.5 text-[12px] text-tinta"
            >
              No pude
            </button>
          </div>
        </div>
      )}
      {screen === "home" ? (
        <Hero query={query} onQueryChange={setQuery} onSearch={handleSearchSubmit} />
      ) : (
        <div className="border-b border-piedra/30 bg-hueso-2 px-4 py-2.5 sm:px-8">
          <button onClick={resetFilters} className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-golfo">
            <i className="ti ti-arrow-left" aria-hidden /> Volver al inicio
          </button>
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            <CompactNavButton active={screen === "explorar"} onClick={handleExplorar} icon="ti-compass" label="Mirando" />
            <CompactNavButton active={false} onClick={handleOpenPublish} icon="ti-plus" label="Publicar" />
            <CompactNavButton active={resultadosIntencion === "ofrezco"} onClick={() => handleSelectIntencion("ofrezco")} icon="ti-tag" label="Ofrece" />
            <CompactNavButton active={resultadosIntencion === "busco"} onClick={() => handleSelectIntencion("busco")} icon="ti-search" label="Busca" />
          </div>
          <p className="text-[12.5px] text-tinta-suave">
            Estás viendo: <span className="font-semibold text-tinta">{breadcrumb}</span>
          </p>
        </div>
      )}
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
      {screen !== "home" && (
        <div className="px-4 pb-1 pt-3 sm:px-8">
          <form
            className="flex max-w-[480px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en Origen El Doradillo"
              className="flex-1 rounded-lg border border-piedra/60 bg-white px-3.5 py-2.5 text-sm text-tinta outline-none"
            />
            <button type="submit" aria-label="Buscar" className="rounded-lg bg-dorado px-4 font-semibold text-oliva-dd">
              <i className="ti ti-search text-lg" aria-hidden />
            </button>
          </form>
        </div>
      )}

      <main className="mx-auto max-w-[1240px] px-4 pb-12 sm:px-7">
        {screen === "home" && (
          <>
            <CuratedRow title="Selección Origen" icon="ti-sparkles" listings={seleccionOrigen.slice(0, 4)} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Productos destacados" icon="ti-star" listings={destacados.slice(0, 4)} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
          </>
        )}

        {screen === "explorar" && (
          <div className="pt-3">
            {anunciosCategoria.length > 0 && (
              <div className="-mx-4 mb-4 sm:-mx-7">
                <AnuncioCarousel anuncios={anunciosCategoria} />
              </div>
            )}
            <CuratedRow title="Selección Origen" icon="ti-sparkles" listings={seleccionOrigen} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Productos recientes" icon="ti-box" listings={productosRecientes} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Servicios disponibles" icon="ti-tools" listings={serviciosDisponibles} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Usados recientes" icon="ti-recycle" listings={usadosRecientes} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Emprendimientos destacados" icon="ti-building-store" listings={emprendimientosDestacados} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
            <CuratedRow title="Búsquedas activas" icon="ti-search" listings={busquedasActivas} onOpen={setActiveListing} favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
          </div>
        )}

        {screen === "resultados" && (
          <div className="pt-3">
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
                <ListingGrid
                  listings={filtered}
                  onOpen={setActiveListing}
                  favoritoIds={favoritoIds}
                  onToggleFavorito={toggleFavorito}
                />
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
        onReview={() =>
          setReviewTarget(
            activeListing
              ? { listingId: String(activeListing.id), listingNombre: activeListing.nombre, publisherName: activeListing.publisherName }
              : null
          )
        }
      />
      {user && activeListing && (
        <ReportListingModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          listingId={String(activeListing.id)}
          user={user}
        />
      )}
      {user && reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          listingId={reviewTarget.listingId}
          listingNombre={reviewTarget.listingNombre}
          publisherName={reviewTarget.publisherName}
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
      {user && (
        <FavoritosModal
          open={favoritosOpen}
          onClose={() => setFavoritosOpen(false)}
          favoritoIds={favoritoIds}
          onToggleFavorito={toggleFavorito}
          onOpenListing={(l) => {
            setFavoritosOpen(false);
            setActiveListing(l);
          }}
        />
      )}
      {user && <ForcePasswordModal open={mustChangePassword} user={user} onDone={() => setMustChangePassword(false)} />}
    </>
  );
}

function CompactNavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[10.5px] font-medium transition ${
        active ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta"
      }`}
    >
      <i className={`ti ${icon} text-base`} aria-hidden />
      {label}
    </button>
  );
}
