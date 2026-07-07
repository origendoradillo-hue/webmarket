import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description: "Cómo funciona Origen El Doradillo: explorar, publicar, contactar por WhatsApp y dejar reseñas.",
};

export default function ComoFuncionaPage() {
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
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-dorado">Guía rápida</p>
        <h1 className="mb-6 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Cómo funciona Origen El Doradillo</h1>

        <div className="flex flex-col gap-6 text-[14.5px] leading-relaxed text-tinta">
          <div>
            <h2 className="mb-1 font-slab text-lg font-semibold text-tinta">1. Explorá</h2>
            <p>
              Desde el inicio elegís "Estoy mirando" para ver todo lo curado por categoría, o filtrás directo por "Se
              ofrece" / "Se busca" y el tipo de publicación que te interesa.
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-slab text-lg font-semibold text-tinta">2. Contactá por WhatsApp</h2>
            <p>
              Cada publicación tiene un botón para contactar directo por WhatsApp. Algunas publicaciones piden que
              inicies sesión antes de ver el contacto — es una medida de seguridad que decide cada publicador.
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-slab text-lg font-semibold text-tinta">3. Dejá una reseña</h2>
            <p>
              Después de contactar a alguien, te vamos a preguntar si pudiste comunicarte. Si la respuesta es sí, te
              invitamos a dejar una reseña real, con tu nombre — ayuda a que la próxima persona confíe más rápido.
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-slab text-lg font-semibold text-tinta">4. Publicá lo tuyo</h2>
            <p>
              Si tenés algo para ofrecer o buscás algo puntual, publicar es gratis y queda activo al instante. Más
              detalle en{" "}
              <Link href="/publicar-en-origen" className="text-golfo underline">
                Publicar en Origen
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-slab text-lg font-semibold text-tinta">El sello "Selección Origen"</h2>
            <p>
              Algunas publicaciones llevan el sello "Selección Origen": una curaduría manual del equipo para destacar
              emprendimientos y productores especialmente recomendados de la zona. No es algo que se compre — lo
              asigna el equipo a criterio propio.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
