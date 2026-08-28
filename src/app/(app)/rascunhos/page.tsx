"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listarRascunhos, removerRascunho } from "@/lib/offline/db";
import { useOffline } from "@/components/offline/provider";
import type { RascunhoLocal } from "@/lib/offline/tipos";
import { dataHoraBR } from "@/lib/formato";

export default function RascunhosPage() {
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

  async function excluir(ref: string) {
    if (!confirm("Excluir este rascunho do aparelho?")) return;
    await removerRascunho(ref);
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
                  href={`/rascunhos/${r.clienteRef}`}
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
