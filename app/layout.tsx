import type { Metadata } from "next";
import { Bitter, Barlow } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Origen El Doradillo",
  description:
    "Productos, servicios y experiencias con origen en la zona rural norte de Madryn.",
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
