import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sobre Origen El Doradillo",
  description:
    "Origen El Doradillo es la guía y mercado local de productos, servicios y experiencias de la zona rural norte de Puerto Madryn, cerca del Parque Ecológico El Doradillo.",
};

export default function SobreOrigenPage() {
  return (
    <div className="min-h-screen bg-hueso">
      <header className="border-b border-piedra/30 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[760px] items-center justify-between">
          <Link href="/" className="font-slab text-base font-semibold text-tinta">
            Origen El Doradillo
          </Link>
          <Link href="/" className="text-[13px] font-medium text-golfo">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-dorado">Sobre nosotros</p>
        <h1 className="mb-6 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Sobre Origen El Doradillo</h1>

        <div className="flex flex-col gap-5 text-[14.5px] leading-relaxed text-tinta">
          <p>
            Origen El Doradillo nació para conectar a los vecinos, productores y prestadores de la zona rural norte de
            Puerto Madryn — la franja de chacras y parcelas que va desde el acceso norte hasta el Parque Ecológico El
            Doradillo — con quienes buscan lo que ellos ofrecen: productos de campo, oficios, turismo, alojamiento y
            mucho más.
          </p>
          <p>
            Es una zona con identidad propia pero sin un lugar único donde encontrar qué se produce, quién presta qué
            servicio, o qué se está por vencer, todo mezclado en grupos de WhatsApp y carteles a la vera del camino.
            Origen El Doradillo ordena eso en un solo sitio, pensado para que cualquier vecino pueda publicar y
            encontrar sin fricción.
          </p>
          <p>
            No somos un mercado anónimo: cada publicación tiene un vecino real detrás, con nombre, WhatsApp verificado
            y, cuando corresponde, un nivel de confianza visible. Esa combinación — cercanía real más una plataforma
            simple — es la que buscamos sostener a medida que la comunidad crece.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
