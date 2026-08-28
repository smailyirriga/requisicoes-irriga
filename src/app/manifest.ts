import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Requisições de Compra — IRRIGA",
    short_name: "Requisições",
    description: "App de requisições de compra da IRRIGA ENGENHARIA",
    // Abre por uma tela leve e sem login que funciona offline; ela redireciona
    // para o app normal quando há internet.
    start_url: "/offline",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#0369a1",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
