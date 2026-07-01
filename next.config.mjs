/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imágenes son todas locales/estáticas y sharp no tiene binario nativo
  // disponible en este entorno; sin esto, /_next/image queda colgado.
  images: { unoptimized: true },
};

export default nextConfig;
