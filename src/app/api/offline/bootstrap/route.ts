import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import type { BootstrapResposta, RequisicaoOffline } from "@/lib/offline/tipos";

export const dynamic = "force-dynamic";

const LIMITE_REQUISICOES = 120;

export async function GET() {
  const u = await usuarioAtual();
  if (!u) return NextResponse.json({ erro: "nao_autenticado" }, { status: 401 });

  const [catalogo, requisicoes, obras] = await Promise.all([
    prisma.itemCatalogo.findMany({
      where: { ativo: true },
      orderBy: { descricao: "asc" },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        natureza: true,
        unidade: true,
        prazoEntrega: true,
        pendente: true,
      },
    }),
    // Leve: sem histórico (a tela offline de detalhe não mostra histórico).
    prisma.requisicao.findMany({
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      take: LIMITE_REQUISICOES,
      select: {
        id: true,
        clienteRef: true,
        numero: true,
        status: true,
        data: true,
        observacaoGeral: true,
        notaDecisao: true,
        obra: { select: { nome: true } },
        solicitante: { select: { nome: true } },
        itens: {
          orderBy: { ordem: "asc" },
          select: {
            id: true,
            finalidade: true,
            descricao: true,
            quantidade: true,
            unidade: true,
            dataDesejavel: true,
            observacoes: true,
            codigo: true,
            prazoEstimado: true,
            valorUnitario: true,
            fornecedor: true,
            statusItem: true,
          },
        },
      },
    }),
    prisma.obra.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const reqs: RequisicaoOffline[] = requisicoes.map((r) => ({
    id: r.id,
    clienteRef: r.clienteRef ?? null,
    numero: r.numero,
    status: r.status,
    obraNome: r.obra.nome,
    solicitanteNome: r.solicitante.nome,
    data: r.data.toISOString(),
    observacaoGeral: r.observacaoGeral,
    notaDecisao: r.notaDecisao,
    historico: [],
    itens: r.itens.map((it) => ({
      id: it.id,
      finalidade: it.finalidade,
      descricao: it.descricao,
      quantidade: it.quantidade,
      unidade: it.unidade,
      dataDesejavel: it.dataDesejavel
        ? it.dataDesejavel.toISOString().slice(0, 10)
        : null,
      observacoes: it.observacoes,
      codigo: it.codigo,
      prazoEstimado: it.prazoEstimado,
      valorUnitario: it.valorUnitario,
      fornecedor: it.fornecedor,
      statusItem: it.statusItem,
    })),
  }));

  const corpo: BootstrapResposta = {
    servidorEm: new Date().toISOString(),
    catalogo,
    requisicoes: reqs,
    obras,
  };

  return NextResponse.json(corpo, { headers: { "Cache-Control": "no-store" } });
}
