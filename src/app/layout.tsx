import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineProvider } from "@/components/offline/provider";
import { RegistrarSW } from "@/components/registrar-sw";

export const metadata: Metadata = {
  title: "Requisições de Compra — IRRIGA",
  description: "App de requisições de compra da IRRIGA ENGENHARIA",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Requisições" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0369a1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <RegistrarSW />
        <OfflineProvider>{children}</OfflineProvider>
      </body>
    </html>
  );
}
