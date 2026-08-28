import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await usuarioAtual();
  if (!u) return NextResponse.json({ erro: "nao_autenticado" }, { status: 401 });

  const obras = await prisma.obra.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
  return NextResponse.json({ obras }, { headers: { "Cache-Control": "no-store" } });
}
