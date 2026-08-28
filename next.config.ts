import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Muda a cada deploy → força o service worker a re-precachear as telas offline.
const revisao =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.SOURCE_VERSION ?? `${Date.now()}`;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  // Telas sem login que precisam abrir mesmo sem internet.
  // O hub /offline concentra tudo que funciona offline (criar, editar, consultar).
  additionalPrecacheEntries: [
    { url: "/offline", revision: revisao },
    { url: "/login", revision: revisao },
  ],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
