import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Seguridad de la comunidad",
  description:
    "Cómo Origen El Doradillo cuida la seguridad de la comunidad: verificación de cuentas, niveles de confianza, denuncias y moderación.",
};

export default function SeguridadPage() {
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
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-dorado">Confianza</p>
        <h1 className="mb-6 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Seguridad de la comunidad</h1>

        <div className="flex flex-col gap-7 text-[14.5px] leading-relaxed text-tinta">
          <p>
            Origen El Doradillo no es un mercado anónimo. Pedimos datos reales (email, WhatsApp, nombre) para que
            cada publicación tenga una persona real detrás, y damos herramientas para que la comunidad se cuide entre
            sí.
          </p>

          <div>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Niveles de confianza</h2>
            <p className="mb-2">Cada cuenta tiene un nivel visible:</p>
            <ul className="flex flex-col gap-1.5 pl-4">
              <li className="list-disc">
                <strong>Nivel 1 · Registrado:</strong> se creó la cuenta con email o Google.
              </li>
              <li className="list-disc">
                <strong>Nivel 2 · Publicador verificado:</strong> se obtiene automáticamente al confirmar el email y
                tener al menos una publicación activa sin denuncias.
              </li>
              <li className="list-disc">
                <strong>Nivel 3 · Verificación reforzada:</strong> para casos puntuales (inmuebles, alojamientos,
                publicaciones de alto valor), revisado a mano por el equipo.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Reseñas reales</h2>
            <p>
              Las reseñas son públicas y con nombre — no hay reseñas anónimas. Ayudan a la comunidad a confiar en
              quién ofrece qué, y también se pueden reportar si alguna parece falsa o abusiva.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Denuncias</h2>
            <p>
              Cualquier publicación se puede denunciar (información falsa, contenido inapropiado, insultos, y más). El
              publicador denunciado puede responder, y el equipo revisa cada caso — puede observar, pausar o eliminar
              una publicación, y en casos de insultos o agravios confirmados, suspender la cuenta de ambas partes
              involucradas.
            </p>
          </div>

          <p className="text-[13px] text-tinta-suave">
            Si algo no te cierra o querés reportar un problema puntual, escribinos — los datos de contacto están en el
            pie de página.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
