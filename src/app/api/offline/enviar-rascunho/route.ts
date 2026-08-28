import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { usuarioAtual } from "@/lib/auth";
import {
  carregarRequisicaoOffline,
  criarRequisicaoCore,
  reqSchema,
} from "@/lib/requisicoes-core";
import type { EnvioResposta } from "@/lib/offline/tipos";

export const dynamic = "force-dynamic";

const corpoSchema = z.object({
  clienteRef: z.string().uuid(),
  intencao: z.enum(["RASCUNHO", "ENVIAR"]),
  payload: reqSchema.omit({ enviar: true }),
});

export async function POST(req: NextRequest) {
  const u = await usuarioAtual();
  if (!u) return NextResponse.json({ erro: "nao_autenticado" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ erro: "json_invalido" }, { status: 400 });
  }

  const parsed = corpoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "dados_invalidos" },
      { status: 400 },
    );
  }

  const { clienteRef, intencao, payload } = parsed.data;

  try {
    const id = await criarRequisicaoCore(
      u,
      { ...payload, enviar: intencao === "ENVIAR" },
      { clienteRef },
    );
    const requisicao = await carregarRequisicaoOffline(id);
    if (!requisicao) throw new Error("Falha ao carregar requisição criada");
    const resposta: EnvioResposta = { clienteRef, requisicao };
    return NextResponse.json(resposta);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro_desconhecido";
    return NextResponse.json({ erro: msg }, { status: 400 });
  }
}
