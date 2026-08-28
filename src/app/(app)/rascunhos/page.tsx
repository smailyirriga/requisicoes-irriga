"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listarRascunhos, obterRascunho, removerRascunho } from "@/lib/offline/db";
import { useOffline } from "@/components/offline/provider";
import { RequisicaoForm, type ItemForm } from "@/components/requisicao-form";
import { NATUREZAS } from "@/lib/constantes";
import type { RascunhoLocal } from "@/lib/offline/tipos";
import { dataHoraBR } from "@/lib/formato";

export default function RascunhosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Carregando…</p>}>
      <Rascunhos />
    </Suspense>
  );
}

function novoKey() {
  return Math.random().toString(36).slice(2);
}

function Rascunhos() {
  const params = useSearchParams();
  const ref = params.get("ref");
  return ref ? <EditarRascunho key={ref} refId={ref} /> : <ListaRascunhos />;
}

function ListaRascunhos() {
  const { online, sincronizando, sincronizarAgora, atualizarPendentes } = useOffline();
  const [lista, setLista] = useState<RascunhoLocal[] | null>(null);

  async function carregar() {
    try {
      setLista(await listarRascunhos());
    } catch {
      setLista([]);
    }
  }
  useEffect(() => {
    carregar();
  }, []);

  async function excluir(clienteRef: string) {
    if (!confirm("Excluir este rascunho do aparelho?")) return;
    await removerRascunho(clienteRef);
    await atualizarPendentes();
    carregar();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Rascunhos no aparelho</h1>
          <p className="text-sm text-slate-500">
            Ficam só neste celular até serem enviados.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/requisicoes/nova" className="btn-primary">
            + Nova
          </Link>
          {online && (
            <button
              className="btn-secondary"
              disabled={sincronizando}
              onClick={async () => {
                await sincronizarAgora();
                carregar();
              }}
            >
              {sincronizando ? "Enviando…" : "Enviar agora"}
            </button>
          )}
        </div>
      </div>

      {lista === null ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-500">
          Nenhum rascunho no aparelho.
        </p>
      ) : (
        <div className="card divide-y divide-slate-100">
          {lista.map((r) => (
            <div key={r.clienteRef} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {r.obraNome ?? "Requisição"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.payload.itens.length} item(s) · atualizado{" "}
                    {dataHoraBR(new Date(r.atualizadoEm))}
                  </p>
                </div>
                <span
                  className={`badge ${
                    r.estado === "ERRO"
                      ? "text-rose-700"
                      : r.estado === "ENVIANDO"
                        ? "text-sky-700"
                        : "text-amber-700"
                  }`}
                >
                  {r.estado === "ERRO"
                    ? "erro"
                    : r.estado === "ENVIANDO"
                      ? "enviando"
                      : r.intencao === "ENVIAR"
                        ? "a enviar"
                        : "rascunho"}
                </span>
              </div>
              {r.erro && <p className="mt-1 text-xs text-rose-600">{r.erro}</p>}
              <div className="mt-2 flex gap-3 text-xs">
                <Link
                  href={`/rascunhos?ref=${r.clienteRef}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  Abrir / editar
                </Link>
                <button
                  onClick={() => excluir(r.clienteRef)}
                  className="font-medium text-rose-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditarRascunho({ refId }: { refId: string }) {
  const [rascunho, setRascunho] = useState<RascunhoLocal | null | undefined>(undefined);

  useEffect(() => {
    obterRascunho(refId).then((r) => setRascunho(r ?? null));
  }, [refId]);

  if (rascunho === undefined)
    return <p className="text-sm text-slate-400">Carregando…</p>;

  if (rascunho === null)
    return (
      <div className="space-y-2">
        <p className="card p-4 text-sm text-slate-600">
          Rascunho não encontrado neste aparelho (pode já ter sido enviado).
        </p>
        <Link href="/rascunhos" className="text-sm text-sky-700 underline">
          ← Rascunhos
        </Link>
      </div>
    );

  const itens: ItemForm[] = rascunho.payload.itens.map((it) => ({
    key: novoKey(),
    itemCatalogoId: it.itemCatalogoId,
    finalidade: it.finalidade,
    descricao: it.descricao,
    quantidade: String(it.quantidade),
    unidade: it.unidade ?? "",
    dataDesejavel: it.dataDesejavel ?? "",
    observacoes: it.observacoes ?? "",
    codigo: it.codigo ?? "",
    prazoEstimado: it.prazoEstimado ?? "",
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/rascunhos" className="text-sm text-sky-700 hover:underline">
          ← Rascunhos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">Editar rascunho</h1>
      </div>
      <RequisicaoForm
        obras={[]}
        naturezas={NATUREZAS}
        rascunhoLocalRef={refId}
        inicial={{
          id: refId,
          obraId: rascunho.payload.obraId,
          observacaoGeral: rascunho.payload.observacaoGeral ?? "",
          itens,
        }}
      />
    </div>
  );
}
