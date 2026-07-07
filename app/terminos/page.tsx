import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de uso de Origen El Doradillo.",
};

export default function TerminosPage() {
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
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-dorado">Legal</p>
        <h1 className="mb-2 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Términos y condiciones</h1>
        <p className="mb-8 text-[13px] text-tinta-suave">Última actualización: julio de 2026.</p>

        <div className="flex flex-col gap-6 text-[14.5px] leading-relaxed text-tinta">
          <section>
            <p>
              Origen El Doradillo es una guía y mercado local que conecta a vecinos, productores y prestadores de la
              zona rural norte de Puerto Madryn con quienes buscan sus productos, servicios o experiencias. Al usar el
              sitio, aceptás estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Publicaciones</h2>
            <p>
              Origen El Doradillo es un intermediario: no vende, presta ni garantiza los productos o servicios
              publicados. Cada transacción se acuerda directamente entre quien publica y quien contacta. Sos
              responsable de que la información que publiques sea veraz.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Cuentas y conducta</h2>
            <p>
              Pedimos datos reales para mantener un entorno confiable. Publicar información falsa, contenido
              inapropiado, o tener conductas abusivas hacia otros usuarios puede resultar en la observación, pausa o
              eliminación de una publicación, y en la suspensión de la cuenta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Limitación de responsabilidad</h2>
            <p>
              No nos hacemos responsables por daños, pérdidas o disputas derivadas de transacciones acordadas entre
              usuarios fuera de la plataforma (por ejemplo, por WhatsApp).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Cambios</h2>
            <p>Podemos actualizar estos términos; el uso continuado del sitio implica que los aceptás.</p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Contacto</h2>
            <p>
              Para consultas, escribinos a{" "}
              <a href="mailto:origendoradillo@gmail.com" className="font-medium text-golfo">
                origendoradillo@gmail.com
              </a>{" "}
              o por{" "}
              <a href="https://wa.me/5492804874717" target="_blank" rel="noreferrer" className="font-medium text-golfo">
                WhatsApp
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
