import type { Metadata } from "next";
import { Bitter, Barlow } from "next/font/google";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { GTM_ID } from "@/lib/analytics";
import Analytics from "@/components/Analytics";
import "./globals.css";

const bitter = Bitter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bitter",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const DESCRIPTION = "Productos, servicios y experiencias con origen en la zona rural norte de Madryn, cerca del Parque Ecológico El Doradillo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: "/brand/og-fallback.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ["/brand/og-fallback.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bitter.variable} ${barlow.variable}`}>
      <head>
        <link rel="stylesheet" href="/tabler-icons/tabler-icons.min.css" />
      </head>
      <body className="font-sans">
        <Analytics />
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
