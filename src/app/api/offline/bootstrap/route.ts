import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { REQ_INCLUDE, serializarRequisicao } from "@/lib/requisicoes-core";
import type { BootstrapResposta } from "@/lib/offline/tipos";

export const dynamic = "force-dynamic";

const LIMITE_REQUISICOES = 150;

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
    prisma.requisicao.findMany({
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      take: LIMITE_REQUISICOES,
      include: REQ_INCLUDE,
    }),
    prisma.obra.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const corpo: BootstrapResposta = {
    servidorEm: new Date().toISOString(),
    catalogo,
    requisicoes: requisicoes.map(serializarRequisicao),
    obras,
  };

  return NextResponse.json(corpo, {
    headers: { "Cache-Control": "no-store" },
  });
}
