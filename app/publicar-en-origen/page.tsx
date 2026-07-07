import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Publicar en Origen El Doradillo",
  description:
    "Cómo publicar tus productos, servicios o experiencias en Origen El Doradillo: es gratis, rápido y tu publicación queda activa al instante.",
};

export default function PublicarEnOrigenPage() {
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
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-dorado">Para publicadores</p>
        <h1 className="mb-6 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Publicar en Origen El Doradillo</h1>

        <div className="flex flex-col gap-5 text-[14.5px] leading-relaxed text-tinta">
          <p>
            Publicar es gratis y queda activo al instante — no hay una revisión previa que te haga esperar para
            empezar a recibir contactos.
          </p>

          <div>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Qué podés publicar</h2>
            <ul className="flex flex-col gap-1.5 pl-4">
              <li className="list-disc">Productos de campo, comida, artesanías.</li>
              <li className="list-disc">Servicios y oficios (electricidad, plomería, jardinería, fletes, y más).</li>
              <li className="list-disc">Experiencias y turismo (cabalgatas, avistaje, excursiones).</li>
              <li className="list-disc">Alojamiento (cabañas, hosterías, alquileres temporarios).</li>
              <li className="list-disc">Inmuebles y usados.</li>
              <li className="list-disc">También podés publicar una búsqueda ("Se busca") si necesitás algo puntual.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Cómo funciona</h2>
            <ol className="flex flex-col gap-1.5 pl-4">
              <li className="list-decimal">Creá tu cuenta con email o Google.</li>
              <li className="list-decimal">Elegí si ofrecés o buscás, y el tipo de publicación.</li>
              <li className="list-decimal">Completá los datos, agregá fotos, y listo — se publica al instante.</li>
              <li className="list-decimal">
                Quien te contacte lo hace directo por WhatsApp; vos elegís si tu contacto pide inicio de sesión o es
                público.
              </li>
            </ol>
          </div>

          <p>
            Tu nombre y WhatsApp vienen de tu perfil (podés usar un nombre público distinto si preferís no mostrar el
            real). Podés pausar, renovar o eliminar tus publicaciones cuando quieras desde "Mis publicaciones".
          </p>

          <p>
            Para cuidar la seguridad de la comunidad, cualquier publicación puede ser denunciada, y el equipo puede
            observar, pausar o eliminar contenido que no cumpla con las reglas del sitio. Más sobre esto en{" "}
            <Link href="/seguridad" className="text-golfo underline">
              Seguridad de la comunidad
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
