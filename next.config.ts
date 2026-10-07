import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // El indicador flotante de desarrollo tapa la esquina inferior izquierda
  // (campana/menú de usuario) e interfiere con las pruebas E2E.
  devIndicators: false,
  // Las pruebas E2E usan su propio directorio de build para no chocar con el
  // servidor de desarrollo (NEXT_DIST_DIR=.next-e2e).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // La versión viaja al runtime para /api/health (npm_package_version está
  // disponible durante `npm run build`).
  env: {
    APP_VERSION: process.env.npm_package_version ?? "0.1.0",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
