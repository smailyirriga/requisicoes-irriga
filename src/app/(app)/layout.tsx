import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { BotaoFeedback } from "@/components/botao-feedback";
import { BarraStatusOffline } from "@/components/offline/barra-status";
import { SyncAoEntrar } from "@/components/offline/sync-ao-entrar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await usuarioAtual();
  if (!u) redirect("/login");

  return (
    <div className="min-h-screen">
      <SyncAoEntrar />
      <Nav nome={u.nome} papel={u.papel} />
      <BarraStatusOffline />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
      <BotaoFeedback />
    </div>
  );
}
