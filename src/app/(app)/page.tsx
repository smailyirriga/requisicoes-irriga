import Link from "next/link";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { STATUS, STATUS_LABEL, type Status } from "@/lib/constantes";
import { StatusBadge } from "@/components/status-badge";
import { RascunhosWidget } from "@/components/offline/rascunhos-widget";
import { LinkRequisicao } from "@/components/offline/link-requisicao";
import { dataBR, numReq } from "@/lib/formato";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const u = (await usuarioAtual())!;
  const sp = await searchParams;
  const fStatus = typeof sp.status === "string" ? sp.status : "";
  const fObra = typeof sp.obra === "string" ? sp.obra : "";
  const fq = typeof sp.q === "string" ? sp.q.trim() : "";
  const fMinhas = sp.minhas === "1";

  const where: Prisma.RequisicaoWhereInput = {};
  if (fStatus) where.status = fStatus;
  if (fObra) where.obraId = fObra;
  if (fMinhas) where.solicitanteId = u.id;
  if (fq) {
    const n = parseInt(fq.replace(/\D/g, ""), 10);
    where.OR = [
      { observacaoGeral: { contains: fq } },
      { itens: { some: { descricao: { contains: fq } } } },
      { itens: { some: { finalidade: { contains: fq } } } },
      ...(Number.isFinite(n) ? [{ numero: n }] : []),
    ];
  }

  const [obras, requisicoes, contagem] = await Promise.all([
    prisma.obra.findMany({ orderBy: { nome: "asc" } }),
    prisma.requisicao.findMany({
      where,
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      take: 200,
      include: {
        obra: true,
        solicitante: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
    }),
    prisma.requisicao.groupBy({ by: ["status"], _count: true }),
  ]);

  const cont = Object.fromEntries(contagem.map((c) => [c.status, c._count])) as Record<
    string,
    number
  >;
  const pendentesAprovacao = cont["ENVIADA"] ?? 0;
  const emCompra = cont["EM_COMPRA"] ?? 0;
  const aprovadas = cont["APROVADA"] ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Requisições</h1>
        <Link href="/requisicoes/nova" className="btn-primary">
          + Nova requisição
        </Link>
      </div>

      <RascunhosWidget />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi titulo="Aguardando aprovação" valor={pendentesAprovacao} href="/?status=ENVIADA" />
        <Kpi titulo="Aprovadas" valor={aprovadas} href="/?status=APROVADA" />
        <Kpi titulo="Em compra" valor={emCompra} href="/?status=EM_COMPRA" />
        <Kpi titulo="Total" valor={requisicoes.length} href="/" />
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-3" method="get">
        <div className="min-w-[8rem] flex-1">
          <label className="rotulo">Buscar</label>
          <input
            name="q"
            defaultValue={fq}
            placeholder="nº, item, finalidade..."
            className="campo"
          />
        </div>
        <div>
          <label className="rotulo">Status</label>
          <select name="status" defaultValue={fStatus} className="campo">
            <option value="">Todos</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s as Status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo">Obra</label>
          <select name="obra" defaultValue={fObra} className="campo">
            <option value="">Todas</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" name="minhas" value="1" defaultChecked={fMinhas} />
          Só as minhas
        </label>
        <button className="btn-secondary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="card divide-y divide-slate-100 overflow-hidden">
        {requisicoes.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Nenhuma requisição encontrada.
          </p>
        )}
        {requisicoes.map((r) => (
          <LinkRequisicao
            key={r.id}
            id={r.id}
            className="flex items-center gap-3 p-3 hover:bg-slate-50"
          >
            <div className="w-14 shrink-0 text-center">
              <div className="font-mono text-sm font-semibold text-slate-700">
                {numReq(r.numero)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">
                {r.obra.nome}
              </div>
              <div className="truncate text-xs text-slate-500">
                {r.solicitante.nome} · {dataBR(r.data)} · {r._count.itens} item(s)
              </div>
            </div>
            <StatusBadge status={r.status} />
          </LinkRequisicao>
        ))}
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, href }: { titulo: string; valor: number; href: string }) {
  return (
    <Link href={href} className="card p-3 hover:bg-slate-50">
      <div className="text-2xl font-bold text-slate-800">{valor}</div>
      <div className="text-xs text-slate-500">{titulo}</div>
    </Link>
  );
}
