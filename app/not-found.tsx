import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-oliva-dd px-6 text-center">
      <Image src="/brand/logo-completo.png" alt="Origen El Doradillo" width={180} height={70} className="h-auto w-[140px]" />
      <p className="font-slab text-lg font-semibold text-hueso">Esta página no existe</p>
      <p className="max-w-sm text-[13px] text-hueso/80">
        Puede que el link esté roto o que la publicación ya no esté disponible.
      </p>
      <Link href="/" className="rounded-lg bg-dorado px-5 py-2.5 text-[13.5px] font-semibold text-oliva-dd">
        Volver al inicio
      </Link>
    </div>
  );
}
