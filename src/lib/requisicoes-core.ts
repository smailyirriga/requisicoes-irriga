import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CODIGO_A_CADASTRAR } from "@/lib/constantes";
import type { RequisicaoOffline } from "@/lib/offline/tipos";

export const itemSchema = z.object({
  itemCatalogoId: z.string().nullish(),
  finalidade: z.string().trim().min(1, "Informe a finalidade").max(300),
  descricao: z.string().trim().min(1, "Informe a descrição").max(1000),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unidade: z.string().trim().max(20).nullish(),
  dataDesejavel: z.string().trim().nullish(),
  observacoes: z.string().trim().max(2000).nullish(),
  codigo: z.string().trim().max(40).nullish(),
  prazoEstimado: z.string().trim().max(40).nullish(),
});

export const reqSchema = z.object({
  obraId: z.string().min(1, "Selecione a obra"),
  observacaoGeral: z.string().trim().max(2000).nullish(),
  enviar: z.boolean().optional(),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});

export type EntradaRequisicao = z.infer<typeof reqSchema>;

export function parseDataISO(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s.slice(0, 10) + "T00:00:00.000Z");
  return isNaN(d.getTime()) ? null : d;
}

export function mapItens(itens: z.infer<typeof itemSchema>[]) {
  return itens.map((it, i) => ({
    itemCatalogoId: it.itemCatalogoId || null,
    finalidade: it.finalidade,
    descricao: it.descricao,
    quantidade: it.quantidade,
    unidade: it.unidade || null,
    dataDesejavel: parseDataISO(it.dataDesejavel),
    observacoes: it.observacoes || null,
    codigo: it.codigo?.trim() ? it.codigo.trim() : CODIGO_A_CADASTRAR,
    prazoEstimado: it.prazoEstimado || null,
    ordem: i,
  }));
}

type Autor = { id: string; nome: string };

/**
 * Cria a requisição (sem redirect). Se `clienteRef` já existir, devolve a existente
 * (idempotência para a sincronização offline).
 */
export async function criarRequisicaoCore(
  autor: Autor,
  entrada: EntradaRequisicao,
  opts: { clienteRef?: string | null } = {},
): Promise<string> {
  const dados = reqSchema.parse(entrada);
  const clienteRef = opts.clienteRef || null;

  if (clienteRef) {
    const existente = await prisma.requisicao.findUnique({
      where: { clienteRef },
      select: { id: true },
    });
    if (existente) return existente.id;
  }

  const obra = await prisma.obra.findUnique({ where: { id: dados.obraId } });
  if (!obra || !obra.ativo) throw new Error("Obra inválida");

  const enviar = !!dados.enviar;

  return prisma.$transaction(async (tx) => {
    const c = await tx.contador.upsert({
      where: { obraId: obra.id },
      create: { obraId: obra.id, ultimo: 1 },
      update: { ultimo: { increment: 1 } },
    });
    const req = await tx.requisicao.create({
      data: {
        numero: c.ultimo,
        obraId: obra.id,
        solicitanteId: autor.id,
        clienteRef,
        observacaoGeral: dados.observacaoGeral || null,
        status: enviar ? "ENVIADA" : "RASCUNHO",
        enviadaEm: enviar ? new Date() : null,
        itens: { create: mapItens(dados.itens) },
        historico: {
          create: [
            { tipo: "CRIADA", autorId: autor.id, autorNome: autor.nome },
            ...(enviar
              ? [{ tipo: "ENVIADA", para: "ENVIADA", autorId: autor.id, autorNome: autor.nome }]
              : []),
          ],
        },
      },
      select: { id: true },
    });
    return req.id;
  });
}

const incluir = {
  obra: true,
  solicitante: { select: { nome: true } },
  itens: { orderBy: { ordem: "asc" } },
  historico: { orderBy: { criadoEm: "asc" }, include: { autor: { select: { nome: true } } } },
} as const;

type RequisicaoCompleta = Prisma.RequisicaoGetPayload<{ include: typeof incluir }>;

export function serializarRequisicao(r: RequisicaoCompleta): RequisicaoOffline {
  return {
    id: r.id,
    clienteRef: r.clienteRef ?? null,
    numero: r.numero,
    status: r.status,
    obraNome: r.obra.nome,
    solicitanteNome: r.solicitante.nome,
    data: r.data.toISOString(),
    observacaoGeral: r.observacaoGeral,
    notaDecisao: r.notaDecisao,
    itens: r.itens.map((it) => ({
      id: it.id,
      finalidade: it.finalidade,
      descricao: it.descricao,
      quantidade: it.quantidade,
      unidade: it.unidade,
      dataDesejavel: it.dataDesejavel ? it.dataDesejavel.toISOString().slice(0, 10) : null,
      observacoes: it.observacoes,
      codigo: it.codigo,
      prazoEstimado: it.prazoEstimado,
      valorUnitario: it.valorUnitario,
      fornecedor: it.fornecedor,
      statusItem: it.statusItem,
    })),
    historico: r.historico.map((h) => ({
      tipo: h.tipo,
      nota: h.nota,
      autorNome: h.autor?.nome ?? h.autorNome ?? null,
      criadoEm: h.criadoEm.toISOString(),
    })),
  };
}

export async function carregarRequisicaoOffline(id: string) {
  const r = await prisma.requisicao.findUnique({ where: { id }, include: incluir });
  return r ? serializarRequisicao(r) : null;
}

export const REQ_INCLUDE = incluir;
