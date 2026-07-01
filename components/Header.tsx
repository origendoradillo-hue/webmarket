"use client";

import Image from "next/image";

interface HeaderProps {
  onOpenMap: () => void;
  onOpenPublish: () => void;
  onLogoClick: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function Header({ onOpenMap, onOpenPublish, onLogoClick, userEmail, onOpenAuth, onSignOut }: HeaderProps) {
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
        {userEmail ? (
          <button
            onClick={onSignOut}
            title={userEmail}
            className="flex items-center gap-1.5 rounded-lg border border-piedra/70 px-2.5 py-2 text-xs font-medium text-nogal sm:px-4 sm:text-sm"
          >
            <i className="ti ti-user-circle text-base" aria-hidden />
            <span className="hidden max-w-[120px] truncate sm:inline">{userEmail}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-lg border border-piedra/70 px-2.5 py-2 text-xs font-medium text-nogal sm:px-4 sm:text-sm"
          >
            <i className="ti ti-login text-base" aria-hidden />
            <span className="hidden sm:inline">Ingresar</span>
          </button>
        )}
      </nav>
    </header>
  );
}
