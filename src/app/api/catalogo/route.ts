import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const u = await usuarioAtual();
  if (!u) return NextResponse.json({ erro: "nao_autenticado" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const natureza = req.nextUrl.searchParams.get("natureza") ?? "";
  if (q.length < 2 && !natureza) return NextResponse.json({ itens: [] });

  const termos = q.split(/\s+/).filter(Boolean).slice(0, 6);
  const itens = await prisma.itemCatalogo.findMany({
    where: {
      ativo: true,
      AND: [
        ...termos.map((t) => ({
          OR: [{ descricao: { contains: t } }, { codigo: { contains: t } }],
        })),
        ...(natureza ? [{ natureza }] : []),
      ],
    },
    orderBy: [{ pendente: "asc" }, { descricao: "asc" }],
    take: 25,
    select: {
      id: true,
      codigo: true,
      descricao: true,
      natureza: true,
      unidade: true,
      prazoEntrega: true,
      pendente: true,
    },
  });

  return NextResponse.json({ itens });
}
