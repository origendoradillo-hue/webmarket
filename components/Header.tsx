"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  onOpenMap: () => void;
  onOpenPublish: () => void;
  onLogoClick: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenMyListings: () => void;
  onOpenFavoritos: () => void;
  onSignOut: () => void;
  isStaff?: boolean;
}

export default function Header({
  onOpenMap,
  onOpenPublish,
  onLogoClick,
  userEmail,
  onOpenAuth,
  onOpenProfile,
  onOpenMyListings,
  onOpenFavoritos,
  onSignOut,
  isStaff,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-piedra/50 bg-hueso-2 px-4 py-3 sm:px-7 sm:py-4">
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2"
        aria-label="Ir al inicio"
      >
        <Image
          src="/brand/logo-compacto.png"
          alt=""
          width={979}
          height={471}
          className="h-7 w-auto sm:h-8"
          priority
        />
        <span className="flex flex-col leading-[1.05] text-left">
          <span className="font-slab text-base font-semibold text-nogal sm:text-lg">Origen</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-piedra sm:text-[10px]">
            El Doradillo
          </span>
        </span>
      </button>

      <nav className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMap}
          className="flex items-center gap-1.5 rounded-lg border border-piedra/70 px-2.5 py-2 text-xs font-medium text-nogal sm:px-4 sm:text-sm"
        >
          <i className="ti ti-map-2 text-base" aria-hidden />
          <span className="hidden sm:inline">Mapa del barrio</span>
        </button>
        <button
          onClick={onOpenPublish}
          className="rounded-lg bg-oliva px-3 py-2 text-xs font-semibold text-hueso sm:px-4 sm:text-sm"
        >
          Publicar
        </button>
        {isStaff && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-dorado px-2.5 py-2 text-xs font-medium text-dorado sm:px-4 sm:text-sm"
          >
            <i className="ti ti-shield-star text-base" aria-hidden />
            <span className="hidden sm:inline">Panel admin</span>
          </Link>
        )}
        {userEmail ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title={userEmail}
              className="flex items-center gap-1.5 rounded-lg border border-piedra/70 px-2.5 py-2 text-xs font-medium text-nogal sm:px-4 sm:text-sm"
            >
              <i className="ti ti-user-circle text-base" aria-hidden />
              <span className="hidden max-w-[120px] truncate sm:inline">{userEmail}</span>
              <i className="ti ti-chevron-down text-sm" aria-hidden />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-lg border border-piedra/50 bg-white shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-tinta hover:bg-hueso-2"
                >
                  <i className="ti ti-user text-base text-oliva" aria-hidden />
                  Mi perfil
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenMyListings();
                  }}
                  className="flex w-full items-center gap-2 border-t border-piedra/30 px-3.5 py-2.5 text-left text-[13px] text-tinta hover:bg-hueso-2"
                >
                  <i className="ti ti-list-details text-base text-oliva" aria-hidden />
                  Mis publicaciones
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenFavoritos();
                  }}
                  className="flex w-full items-center gap-2 border-t border-piedra/30 px-3.5 py-2.5 text-left text-[13px] text-tinta hover:bg-hueso-2"
                >
                  <i className="ti ti-heart text-base text-oliva" aria-hidden />
                  Mis favoritos
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-2 border-t border-piedra/30 px-3.5 py-2.5 text-left text-[13px] text-tinta hover:bg-hueso-2"
                >
                  <i className="ti ti-logout text-base text-golfo" aria-hidden />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-lg border border-piedra/70 px-2.5 py-2 text-xs font-medium text-nogal sm:px-4 sm:text-sm"
          >
            <i className="ti ti-door-enter text-base" aria-hidden />
            <span className="hidden sm:inline">Ingresar</span>
          </button>
        )}
      </nav>
    </header>
  );
}
