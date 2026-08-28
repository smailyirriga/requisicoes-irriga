"use client";

import {
  getMeta,
  listarRascunhos,
  removerRascunho,
  salvarCatalogo,
  salvarRascunho,
  salvarRequisicao,
  salvarRequisicoes,
  setMeta,
} from "./db";
import type {
  BootstrapResposta,
  EnvioResposta,
  RascunhoLocal,
  RascunhoPayload,
} from "./tipos";

export function novoClienteRef(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function estaOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const r = await fetch("/api/health", { cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

/** Baixa catálogo + requisições recentes para uso offline. */
export async function baixarDados(): Promise<{ ok: boolean; erro?: string }> {
  try {
    const r = await fetch("/api/offline/bootstrap", { cache: "no-store" });
    if (r.status === 401) return { ok: false, erro: "Sessão expirada. Entre novamente." };
    if (!r.ok) return { ok: false, erro: `Falha (${r.status})` };
    const dados = (await r.json()) as BootstrapResposta;
    await salvarCatalogo(dados.catalogo);
    await salvarRequisicoes(dados.requisicoes);
    await setMeta("obras", dados.obras);
    await setMeta("sincronizadoEm", Date.now());

    // Conciliação: remove rascunhos locais que já viraram requisição no servidor.
    const refsNoServidor = new Set(
      dados.requisicoes.map((rq) => rq.clienteRef).filter(Boolean) as string[],
    );
    if (refsNoServidor.size) {
      for (const rasc of await listarRascunhos()) {
        if (refsNoServidor.has(rasc.clienteRef)) await removerRascunho(rasc.clienteRef);
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro de rede" };
  }
}

export async function obterObrasLocais(): Promise<{ id: string; nome: string }[]> {
  return (await getMeta<{ id: string; nome: string }[]>("obras")) ?? [];
}

/** Envia ao servidor os rascunhos marcados para envio/sincronização. */
let enviando = false;

export async function enviarRascunhos(): Promise<{
  enviados: number;
  erros: number;
}> {
  if (enviando) return { enviados: 0, erros: 0 };
  enviando = true;
  try {
    return await enviarRascunhosInterno();
  } finally {
    enviando = false;
  }
}

async function enviarRascunhosInterno(): Promise<{
  enviados: number;
  erros: number;
}> {
  const rascunhos = await listarRascunhos();
  // Só sobem os marcados para ENVIAR. "Salvar rascunho" fica só no aparelho.
  // "ENVIANDO" entra de novo porque o POST é idempotente (clienteRef) — resolve
  // rascunhos presos por uma interrupção.
  const pendentes = rascunhos.filter(
    (r) => r.intencao === "ENVIAR" && r.estado !== "ENVIADO",
  );
  let enviados = 0;
  let erros = 0;

  for (const r of pendentes) {
    await salvarRascunho({ ...r, estado: "ENVIANDO", erro: null });
    try {
      const resp = await fetch("/api/offline/enviar-rascunho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteRef: r.clienteRef,
          intencao: r.intencao,
          payload: r.payload,
        }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.erro || `Falha (${resp.status})`);
      }
      const dados = (await resp.json()) as EnvioResposta;
      await salvarRequisicao(dados.requisicao);
      await removerRascunho(r.clienteRef);
      enviados++;
    } catch (e) {
      erros++;
      await salvarRascunho({
        ...r,
        estado: "ERRO",
        erro: e instanceof Error ? e.message : "Erro ao enviar",
      });
    }
  }
  return { enviados, erros };
}

export type ResultadoSync = {
  baixou: boolean;
  enviados: number;
  erros: number;
  erro?: string;
};

/** Sincronização completa: envia rascunhos e baixa dados novos. */
export async function sincronizar(): Promise<ResultadoSync> {
  if (!(await estaOnline())) {
    return { baixou: false, enviados: 0, erros: 0, erro: "sem-conexao" };
  }
  const env = await enviarRascunhos();
  const baixa = await baixarDados();
  return {
    baixou: baixa.ok,
    enviados: env.enviados,
    erros: env.erros,
    erro: baixa.ok ? undefined : baixa.erro,
  };
}

/** Cria/atualiza um rascunho local. */
export async function guardarRascunhoLocal(
  clienteRef: string | null,
  payload: RascunhoPayload,
  intencao: RascunhoLocal["intencao"],
  obraNome?: string,
): Promise<RascunhoLocal> {
  const ref = clienteRef ?? novoClienteRef();
  const agora = Date.now();
  const existente = clienteRef
    ? (await listarRascunhos()).find((r) => r.clienteRef === clienteRef)
    : undefined;
  const rascunho: RascunhoLocal = {
    clienteRef: ref,
    payload,
    intencao,
    estado: "LOCAL",
    erro: null,
    obraNome,
    criadoEm: existente?.criadoEm ?? agora,
    atualizadoEm: agora,
  };
  await salvarRascunho(rascunho);
  return rascunho;
}
