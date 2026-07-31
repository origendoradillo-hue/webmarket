import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /p/[code] son links cortos para compartir (WhatsApp, redes) que
      // redirigen a /publicacion o /anuncio — no hace falta que Google los
      // rastree ni los muestre en resultados, solo el destino final.
      disallow: ["/admin", "/api", "/p/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
