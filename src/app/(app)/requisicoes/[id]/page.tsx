import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { AcoesRequisicao } from "@/components/acoes-requisicao";
import { ValoresForm } from "@/components/valores-form";
import { comentar } from "@/actions/requisicoes";
import { acoesDisponiveis, podeEditar, podeVerValores, podeEditarValores } from "@/lib/fluxo";
import { dataBR, dataHoraBR, moedaBR, numeroBR, numReq } from "@/lib/formato";

export const dynamic = "force-dynamic";

const EVENTO_LABEL: Record<string, string> = {
  CRIADA: "Requisição criada",
  EDITADA: "Requisição editada",
  ENVIADA: "Enviada para aprovação",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EM_COMPRA: "Compra iniciada",
  RECEBIDA: "Marcada como recebida",
  CANCELADA: "Cancelada",
  REABERTA: "Reaberta (voltou a rascunho)",
  COMENTARIO: "Comentário",
  VALORES: "Valores atualizados",
  IMPORTADA: "Importada da planilha",
};

export default async function RequisicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = (await usuarioAtual())!;

  const req = await prisma.requisicao.findUnique({
    where: { id },
    include: {
      obra: true,
      solicitante: { select: { nome: true } },
      decisor: { select: { nome: true } },
      itens: { orderBy: { ordem: "asc" } },
      historico: { orderBy: { criadoEm: "asc" }, include: { autor: { select: { nome: true } } } },
    },
  });
  if (!req) notFound();

  const acoes = acoesDisponiveis(u, req);
  const editavel = podeEditar(u, req);
  const verValores = podeVerValores(u.papel);
  const editarValores = podeEditarValores(u.papel) && (req.status === "EM_COMPRA" || req.status === "APROVADA");
  const podeExcluir = req.status === "RASCUNHO" && (req.solicitanteId === u.id || u.papel === "ADMIN");

  const totalEstimado = req.itens.reduce(
    (s, it) => s + (it.valorUnitario != null ? it.valorUnitario * it.quantidade : 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-sky-700 hover:underline">
            ← Requisições
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-800">
            Requisição {numReq(req.numero)}
            <StatusBadge status={req.status} />
          </h1>
          <p className="text-sm text-slate-500">
            {req.obra.nome} · Solicitante: {req.solicitante.nome} · {dataBR(req.data)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/requisicoes/${req.id}/exportar`} className="btn-secondary">
            Baixar Excel
          </a>
          {editavel && (
            <Link href={`/requisicoes/${req.id}/editar`} className="btn-secondary">
              Editar
            </Link>
          )}
        </div>
      </div>

      {req.observacaoGeral && (
        <div className="card p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-500">Observações gerais: </span>
          {req.observacaoGeral}
        </div>
      )}

      {req.status === "RECUSADA" && req.notaDecisao && (
        <div className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="font-semibold">Motivo da recusa: </span>
          {req.notaDecisao}
        </div>
      )}

      <AcoesRequisicao id={req.id} acoes={acoes} podeExcluir={podeExcluir} />

      {/* Itens */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-3 text-sm font-semibold text-slate-600">
          Itens ({req.itens.length})
        </div>
        <div className="divide-y divide-slate-100">
          {req.itens.map((it, i) => (
            <div key={it.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {i + 1}. {it.finalidade}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {it.codigo && it.codigo !== "CADASTRAR" ? `cód. ${it.codigo}` : "a cadastrar"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-800">{it.descricao}</p>
              <p className="mt-1 text-xs text-slate-500">
                {numeroBR(it.quantidade)} {it.unidade ?? ""}
                {it.dataDesejavel ? ` · desejável: ${dataBR(it.dataDesejavel)}` : ""}
                {it.prazoEstimado ? ` · prazo: ${it.prazoEstimado}` : ""}
              </p>
              {it.observacoes && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                  Obs.: {it.observacoes}
                </p>
              )}
              {verValores && (it.valorUnitario != null || it.fornecedor || it.statusItem) && (
                <p className="mt-1 text-xs text-slate-600">
                  {it.valorUnitario != null &&
                    `${moedaBR(it.valorUnitario)}/un · subtotal ${moedaBR(it.valorUnitario * it.quantidade)}`}
                  {it.fornecedor ? ` · ${it.fornecedor}` : ""}
                  {it.statusItem ? ` · ${it.statusItem}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
        {verValores && totalEstimado > 0 && (
          <div className="border-t border-slate-100 p-3 text-right text-sm font-semibold text-slate-700">
            Total estimado: {moedaBR(totalEstimado)}
          </div>
        )}
      </div>

      {editarValores && (
        <ValoresForm
          id={req.id}
          itens={req.itens.map((it) => ({
            id: it.id,
            descricao: it.descricao,
            quantidade: it.quantidade,
            unidade: it.unidade,
            valorUnitario: it.valorUnitario,
            fornecedor: it.fornecedor,
            statusItem: it.statusItem,
          }))}
        />
      )}

      {/* Histórico */}
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Histórico</h2>
        <ol className="space-y-3">
          {req.historico.map((h) => (
            <li key={h.id} className="flex gap-3 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
              <div>
                <p className="text-slate-700">
                  <span className="font-medium">{EVENTO_LABEL[h.tipo] ?? h.tipo}</span>
                  {" · "}
                  <span className="text-slate-400">
                    {h.autor?.nome ?? h.autorNome ?? "Sistema"} · {dataHoraBR(h.criadoEm)}
                  </span>
                </p>
                {h.nota && <p className="whitespace-pre-wrap text-slate-600">{h.nota}</p>}
              </div>
            </li>
          ))}
        </ol>

        <form action={comentar.bind(null, req.id)} className="mt-4 flex gap-2">
          <input
            name="texto"
            className="campo"
            placeholder="Escrever um comentário..."
            required
          />
          <button className="btn-secondary" type="submit">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
