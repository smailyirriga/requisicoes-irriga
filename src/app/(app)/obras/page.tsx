import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { FormNovaObra } from "@/components/forms-admin";
import { alternarAtivoObra } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const u = (await usuarioAtual())!;
  if (u.papel !== "ADMIN") redirect("/");

  const obras = await prisma.obra.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { requisicoes: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Obras</h1>
      <FormNovaObra />
      <div className="card divide-y divide-slate-100">
        {obras.map((o) => (
          <div key={o.id} className={`flex items-center gap-3 p-3 ${!o.ativo ? "opacity-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{o.nome}</p>
              <p className="text-xs text-slate-400">
                {[o.codigo, o.cidadeUf].filter(Boolean).join(" · ")}
                {o.codigo || o.cidadeUf ? " · " : ""}
                {o._count.requisicoes} requisição(ões){!o.ativo ? " · inativa" : ""}
              </p>
            </div>
            <form action={alternarAtivoObra}>
              <input type="hidden" name="id" value={o.id} />
              <button className="text-xs text-slate-400 hover:underline">
                {o.ativo ? "Inativar" : "Reativar"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
