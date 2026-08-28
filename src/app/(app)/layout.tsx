import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { RegistrarSW } from "@/components/registrar-sw";
import { BotaoFeedback } from "@/components/botao-feedback";
import { OfflineProvider } from "@/components/offline/provider";
import { BarraStatusOffline } from "@/components/offline/barra-status";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await usuarioAtual();
  if (!u) redirect("/login");

  return (
    <OfflineProvider>
      <div className="min-h-screen">
        <RegistrarSW />
        <Nav nome={u.nome} papel={u.papel} />
        <BarraStatusOffline />
        <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
        <BotaoFeedback />
      </div>
    </OfflineProvider>
  );
}
