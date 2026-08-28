import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { NATUREZAS } from "@/lib/constantes";
import { FormNovoItemCatalogo } from "@/components/form-catalogo";
import { definirCodigoItem, alternarAtivoItem } from "@/actions/catalogo";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const u = (await usuarioAtual())!;
  const podeGerir = u.papel === "ADMIN" || u.papel === "SUPRIMENTOS";
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const natureza = typeof sp.natureza === "string" ? sp.natureza : "";
  const soPendentes = sp.pendentes === "1";

  const where: Prisma.ItemCatalogoWhereInput = {};
  if (natureza) where.natureza = natureza;
  if (soPendentes) where.pendente = true;
  if (q) {
    const termos = q.split(/\s+/).filter(Boolean).slice(0, 6);
    where.AND = termos.map((t) => ({
      OR: [{ descricao: { contains: t } }, { codigo: { contains: t } }],
    }));
  }

  const [total, itens] = await Promise.all([
    prisma.itemCatalogo.count(),
    prisma.itemCatalogo.findMany({
      where,
      orderBy: [{ pendente: "desc" }, { descricao: "asc" }],
      take: 300,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Catálogo</h1>
        <p className="text-sm text-slate-500">{total} itens cadastrados</p>
      </div>

      {podeGerir && <FormNovoItemCatalogo />}

      <form method="get" className="card flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-[10rem] flex-1">
          <label className="rotulo">Buscar</label>
          <input name="q" defaultValue={q} className="campo" placeholder="descrição ou código" />
        </div>
        <div>
          <label className="rotulo">Natureza</label>
          <select name="natureza" defaultValue={natureza} className="campo">
            <option value="">Todas</option>
            {NATUREZAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" name="pendentes" value="1" defaultChecked={soPendentes} />
          Só sem código
        </label>
        <button className="btn-secondary">Filtrar</button>
      </form>

      <div className="card divide-y divide-slate-100">
        {itens.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">Nenhum item.</p>
        )}
        {itens.map((it) => (
          <div key={it.id} className={`p-3 ${!it.ativo ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="w-16 shrink-0 font-mono text-xs text-slate-500">
                {it.codigo ?? "—"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">{it.descricao}</p>
                <p className="text-xs text-slate-400">
                  {[it.natureza, it.unidade, it.prazoEntrega].filter(Boolean).join(" · ")}
                  {it.pendente ? " · sem código" : ""}
                  {!it.ativo ? " · inativo" : ""}
                </p>
                {podeGerir && it.pendente && (
                  <form action={definirCodigoItem} className="mt-2 flex gap-2">
                    <input type="hidden" name="id" value={it.id} />
                    <input
                      name="codigo"
                      className="campo max-w-[10rem] py-1"
                      placeholder="definir código"
                      required
                    />
                    <button className="btn-secondary py-1">Salvar código</button>
                  </form>
                )}
              </div>
              {podeGerir && (
                <form action={alternarAtivoItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-xs text-slate-400 hover:underline">
                    {it.ativo ? "Inativar" : "Reativar"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
      {itens.length === 300 && (
        <p className="text-center text-xs text-slate-400">
          Mostrando os primeiros 300. Refine a busca.
        </p>
      )}
    </div>
  );
}
