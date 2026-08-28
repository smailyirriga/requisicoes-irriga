"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import {
  ACAO_EVENTO,
  ACAO_STATUS,
  acoesDisponiveis,
  podeEditar,
  podeEditarValores,
  type Acao,
} from "@/lib/fluxo";
import {
  criarRequisicaoCore,
  mapItens,
  reqSchema,
  type EntradaRequisicao,
} from "@/lib/requisicoes-core";

export type { EntradaRequisicao };

export async function criarRequisicao(entrada: EntradaRequisicao) {
  const u = await exigirUsuario();
  const novaId = await criarRequisicaoCore(u, entrada);
  revalidatePath("/");
  redirect(`/requisicoes/${novaId}`);
}

export async function atualizarRequisicao(id: string, entrada: EntradaRequisicao) {
  const u = await exigirUsuario();
  const dados = reqSchema.parse(entrada);

  const req = await prisma.requisicao.findUnique({ where: { id } });
  if (!req) throw new Error("Requisição não encontrada");
  if (!podeEditar(u, req)) throw new Error("Sem permissão para editar");

  const enviar = !!dados.enviar;

  await prisma.$transaction(async (tx) => {
    await tx.requisicaoItem.deleteMany({ where: { requisicaoId: id } });
    await tx.requisicao.update({
      where: { id },
      data: {
        obraId: dados.obraId,
        observacaoGeral: dados.observacaoGeral || null,
        status: enviar ? "ENVIADA" : req.status,
        enviadaEm: enviar ? new Date() : req.enviadaEm,
        itens: { create: mapItens(dados.itens) },
        historico: {
          create: [
            { tipo: "EDITADA", autorId: u.id, autorNome: u.nome },
            ...(enviar
              ? [{ tipo: "ENVIADA", para: "ENVIADA", autorId: u.id, autorNome: u.nome }]
              : []),
          ],
        },
      },
    });
  });

  revalidatePath(`/requisicoes/${id}`);
  revalidatePath("/");
  redirect(`/requisicoes/${id}`);
}

const acaoSchema = z.object({
  acao: z.string(),
  nota: z.string().trim().max(2000).optional(),
});

export async function executarAcao(id: string, formData: FormData) {
  const u = await exigirUsuario();
  const { acao, nota } = acaoSchema.parse({
    acao: formData.get("acao"),
    nota: formData.get("nota") || undefined,
  });

  const req = await prisma.requisicao.findUnique({ where: { id } });
  if (!req) throw new Error("Requisição não encontrada");

  const permitidas = acoesDisponiveis(u, req);
  const a = acao as Acao;
  const normalizada = a === "CANCELAR_ADMIN" ? "CANCELAR_ADMIN" : a;
  if (!permitidas.includes(normalizada as Acao)) {
    throw new Error("Ação não permitida no status atual");
  }

  if ((a === "RECUSAR") && !nota) {
    throw new Error("Informe o motivo da recusa");
  }

  const novoStatus = ACAO_STATUS[a];
  const ehDecisao = a === "APROVAR" || a === "RECUSAR";

  await prisma.requisicao.update({
    where: { id },
    data: {
      status: novoStatus,
      decisorId: ehDecisao ? u.id : req.decisorId,
      decididaEm: ehDecisao ? new Date() : req.decididaEm,
      notaDecisao: ehDecisao ? nota || null : req.notaDecisao,
      enviadaEm: a === "ENVIAR" ? new Date() : req.enviadaEm,
      historico: {
        create: {
          tipo: ACAO_EVENTO[a],
          de: req.status,
          para: novoStatus,
          nota: nota || null,
          autorId: u.id,
          autorNome: u.nome,
        },
      },
    },
  });

  revalidatePath(`/requisicoes/${id}`);
  revalidatePath("/");
}

export async function comentar(id: string, formData: FormData) {
  const u = await exigirUsuario();
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return;
  await prisma.requisicaoEvento.create({
    data: {
      requisicaoId: id,
      tipo: "COMENTARIO",
      nota: texto.slice(0, 2000),
      autorId: u.id,
      autorNome: u.nome,
    },
  });
  revalidatePath(`/requisicoes/${id}`);
}

const valoresSchema = z.object({
  itens: z.array(
    z.object({
      id: z.string(),
      valorUnitario: z.coerce.number().nonnegative().nullish(),
      fornecedor: z.string().trim().max(200).nullish(),
      statusItem: z.string().trim().max(20).nullish(),
    }),
  ),
});

export async function salvarValores(
  id: string,
  entrada: z.infer<typeof valoresSchema>,
) {
  const u = await exigirUsuario();
  if (!podeEditarValores(u.papel)) throw new Error("Sem permissão");
  const dados = valoresSchema.parse(entrada);

  await prisma.$transaction(
    dados.itens.map((it) =>
      prisma.requisicaoItem.update({
        where: { id: it.id },
        data: {
          valorUnitario: it.valorUnitario ?? null,
          fornecedor: it.fornecedor || null,
          statusItem: it.statusItem || null,
        },
      }),
    ),
  );
  await prisma.requisicaoEvento.create({
    data: {
      requisicaoId: id,
      tipo: "VALORES",
      nota: "Valores/fornecedores atualizados por Suprimentos.",
      autorId: u.id,
      autorNome: u.nome,
    },
  });
  revalidatePath(`/requisicoes/${id}`);
}

export async function excluirRascunho(id: string) {
  const u = await exigirUsuario();
  const req = await prisma.requisicao.findUnique({ where: { id } });
  if (!req) return;
  if (req.status !== "RASCUNHO" || (req.solicitanteId !== u.id && u.papel !== "ADMIN")) {
    throw new Error("Só é possível excluir rascunhos próprios");
  }
  await prisma.requisicao.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}
