import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad | Origen El Doradillo",
  description: "Cómo Origen El Doradillo recolecta, usa y protege los datos de su comunidad.",
};

export default function PrivacidadPage() {
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
        <h1 className="mb-2 font-slab text-2xl font-semibold text-tinta sm:text-3xl">Política de Privacidad</h1>
        <p className="mb-8 text-[13px] text-tinta-suave">Última actualización: julio de 2026.</p>

        <div className="flex flex-col gap-7 text-[14.5px] leading-relaxed text-tinta">
          <section>
            <p>
              Origen El Doradillo es una guía y mercado local para la zona rural norte de Puerto Madryn. Esta política
              explica qué datos recolectamos de quienes usan el sitio, para qué los usamos y qué derechos tenés sobre
              ellos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Qué datos recolectamos</h2>
            <ul className="flex flex-col gap-1.5 pl-4">
              <li className="list-disc">
                <strong>Datos de cuenta:</strong> nombre, email, número de WhatsApp y contraseña (o tu cuenta de Google,
                si elegís ingresar así).
              </li>
              <li className="list-disc">
                <strong>Datos de publicaciones:</strong> lo que cargás al publicar — fotos, descripciones, precios,
                zona y, si lo indicás, una dirección.
              </li>
              <li className="list-disc">
                <strong>Datos de uso:</strong> registramos cuándo alguien pide el contacto de WhatsApp de una
                publicación (sin guardar el contenido de la conversación), y las denuncias que se presentan sobre una
                publicación.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Para qué los usamos</h2>
            <p>
              Usamos estos datos para operar la plataforma: mostrar tus publicaciones, permitir que otros vecinos te
              contacten, cuidar la seguridad de la comunidad (evitar publicaciones falsas o cuentas duplicadas),
              moderar denuncias y, si lo solicitás, verificar tu identidad para niveles de confianza más altos.
              No usamos tus datos para publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Con quién los compartimos</h2>
            <p className="mb-2">
              No vendemos ni alquilamos tus datos. Los compartimos únicamente con:
            </p>
            <ul className="flex flex-col gap-1.5 pl-4">
              <li className="list-disc">
                <strong>Supabase</strong>, el proveedor que aloja nuestra base de datos y gestiona el inicio de
                sesión (incluido, si lo usás, el ingreso con Google).
              </li>
              <li className="list-disc">
                <strong>Vercel</strong>, donde se aloja el sitio web.
              </li>
              <li className="list-disc">Otros vecinos, únicamente la información que vos elegís mostrar en tu publicación pública.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Tus derechos</h2>
            <p>
              Podés acceder, corregir o eliminar tus datos en cualquier momento desde "Mi perfil". También podés
              pedirnos que eliminemos tu cuenta y toda tu información escribiéndonos por WhatsApp o email (abajo
              tenés los datos de contacto) — la eliminamos de forma permanente en un plazo razonable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Cookies y sesión</h2>
            <p>
              Usamos únicamente cookies técnicas necesarias para mantener tu sesión iniciada. No usamos cookies de
              seguimiento publicitario.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Menores de edad</h2>
            <p>Origen El Doradillo no está dirigido a menores de 13 años y no recolectamos datos a sabiendas de niños.</p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Cambios a esta política</h2>
            <p>
              Si actualizamos esta política de forma relevante, lo vamos a avisar en el sitio. El uso continuado de
              Origen El Doradillo después de un cambio implica que lo aceptás.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-slab text-lg font-semibold text-tinta">Contacto</h2>
            <p>
              Para cualquier consulta sobre tus datos, escribinos a{" "}
              <a href="mailto:origendoradillo@gmail.com" className="font-medium text-golfo">
                origendoradillo@gmail.com
              </a>{" "}
              o por{" "}
              <a href="https://wa.me/5491136450498" target="_blank" rel="noreferrer" className="font-medium text-golfo">
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
