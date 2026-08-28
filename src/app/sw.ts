import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // Assets versionados do Next — imutáveis
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static",
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    // Dados para uso offline (catálogo, obras, requisições)
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/offline") ||
        url.pathname === "/api/obras" ||
        url.pathname === "/api/catalogo",
      handler: new NetworkFirst({
        cacheName: "dados-offline",
        networkTimeoutSeconds: 20,
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 })],
      }),
    },
    // Payloads RSC (navegação client-side do Next)
    {
      matcher: ({ url, request }) =>
        request.headers.get("RSC") === "1" || url.search.includes("_rsc="),
      handler: new NetworkFirst({
        cacheName: "rsc",
        networkTimeoutSeconds: 5,
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 14 })],
      }),
    },
    // Navegações (HTML): rede primeiro, cache como reserva
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "paginas",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 14 })],
      }),
    },
    // CSS / JS / workers
    {
      matcher: ({ request }) =>
        ["style", "script", "worker"].includes(request.destination),
      handler: new StaleWhileRevalidate({ cacheName: "assets" }),
    },
    // Imagens
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "imagens",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
});

serwist.addEventListeners();
