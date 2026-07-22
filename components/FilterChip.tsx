"use client";

// Chip de opción dentro de un FilterDropdown — con casilla de selección
// (tildada cuando está elegida) para que se note más claro cuál está
// activa, además del color de fondo que ya usaban estos chips.
export default function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] ${
        selected ? "border-oliva bg-oliva text-hueso" : "border-piedra/60 bg-white text-tinta"
      }`}
    >
      <i className={`ti ${selected ? "ti-square-check" : "ti-square"} text-sm`} aria-hidden />
      {children}
    </button>
  );
}
