import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sobre-origen`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/publicar-en-origen`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/seguridad`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/como-funciona`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("status", "activa");

  const listingRoutes: MetadataRoute.Sitemap = (listings || []).map((l) => ({
    url: `${SITE_URL}/publicacion/${l.id}`,
    lastModified: l.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...listingRoutes];
}
