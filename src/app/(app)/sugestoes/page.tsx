import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { resolverFeedback } from "@/actions/feedback";
import { dataHoraBR } from "@/lib/formato";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  SUGESTAO: "Sugestão",
  PROBLEMA: "Problema",
  DUVIDA: "Dúvida",
};

export default async function SugestoesPage() {
  const u = (await usuarioAtual())!;
  if (u.papel !== "ADMIN") redirect("/");

  const lista = await prisma.feedback.findMany({
    orderBy: [{ resolvido: "asc" }, { criadoEm: "desc" }],
  });
  const abertos = lista.filter((f) => !f.resolvido).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Sugestões da validação
        </h1>
        <p className="text-sm text-slate-500">
          {abertos} em aberto · {lista.length} no total
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {lista.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Nenhuma sugestão ainda.
          </p>
        )}
        {lista.map((f) => (
          <div key={f.id} className={`p-3 ${f.resolvido ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span
                className={`badge ${
                  f.tipo === "PROBLEMA"
                    ? "text-rose-700"
                    : f.tipo === "DUVIDA"
                      ? "text-amber-700"
                      : "text-sky-700"
                }`}
              >
                {TIPO_LABEL[f.tipo] ?? f.tipo}
              </span>
              <span>{f.autorNome ?? "—"}</span>
              {f.papel && <span>· {f.papel}</span>}
              <span>· {dataHoraBR(f.criadoEm)}</span>
              {f.pagina && <span>· {f.pagina}</span>}
              {f.resolvido && <span>· ✓ resolvido</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{f.texto}</p>
            {f.resposta && (
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                Resposta: {f.resposta}
              </p>
            )}
            <form action={resolverFeedback} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={f.id} />
              {!f.resolvido && (
                <input
                  name="resposta"
                  className="campo max-w-xs py-1 text-xs"
                  placeholder="resposta / anotação (opcional)"
                />
              )}
              <button className="btn-secondary py-1 text-xs">
                {f.resolvido ? "Reabrir" : "Marcar resolvido"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
