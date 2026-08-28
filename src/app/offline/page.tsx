"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listarRascunhos,
  listarRequisicoesLocais,
} from "@/lib/offline/db";
import { sincronizar } from "@/lib/offline/sync";
import type { RascunhoLocal, RequisicaoOffline } from "@/lib/offline/tipos";
import { STATUS_LABEL, type Status } from "@/lib/constantes";

export default function OfflineHub() {
  const [rascunhos, setRascunhos] = useState<RascunhoLocal[]>([]);
  const [reqs, setReqs] = useState<RequisicaoOffline[]>([]);
  const [q, setQ] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(true);

  async function carregar() {
    try {
      const [rs, rq] = await Promise.all([
        listarRascunhos(),
        listarRequisicoesLocais(),
      ]);
      setRascunhos(rs);
      setReqs(rq);
    } catch {
      /* indexeddb indisponível */
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    carregar();
  }, []);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return reqs;
    return reqs.filter(
      (r) =>
        String(r.numero).includes(t) ||
        r.obraNome.toLowerCase().includes(t) ||
        r.solicitanteNome.toLowerCase().includes(t) ||
        r.itens.some((i) => i.descricao.toLowerCase().includes(t)),
    );
  }, [q, reqs]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">
          {online ? "Requisições salvas no aparelho" : "Modo offline"}
        </h1>
        <Link href="/" className="text-sm text-sky-700 hover:underline">
          {online ? "Abrir app normal" : "Tentar online"}
        </Link>
      </div>

      {!online && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sem internet. Você pode criar requisições e consultar o que já foi baixado.
          Tudo será enviado quando o sinal voltar.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/requisicoes/nova" className="btn-primary">
          + Nova requisição
        </Link>
        {online && (
          <button
            className="btn-secondary"
            onClick={async () => {
              await sincronizar();
              carregar();
            }}
          >
            Sincronizar
          </button>
        )}
      </div>

      {rascunhos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600">
            Não enviadas ({rascunhos.length})
          </h2>
          <div className="card divide-y divide-slate-100">
            {rascunhos.map((r) => (
              <Link
                key={r.clienteRef}
                href={`/rascunhos/${r.clienteRef}`}
                className="block p-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {r.obraNome ?? "Requisição"}
                  </span>
                  <span
                    className={`badge ${
                      r.estado === "ERRO" ? "text-rose-700" : "text-amber-700"
                    }`}
                  >
                    {r.estado === "ERRO"
                      ? "erro ao enviar"
                      : r.intencao === "ENVIAR"
                        ? "aguardando envio"
                        : "rascunho"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {r.payload.itens.length} item(s)
                  {r.erro ? ` · ${r.erro}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <input
          className="campo"
          placeholder="Buscar nas requisições baixadas..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {carregando ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : filtradas.length === 0 ? (
          <p className="card p-4 text-center text-sm text-slate-500">
            Nenhuma requisição baixada. Abra o app com internet para sincronizar.
          </p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {filtradas.map((r) => (
              <Link
                key={r.id}
                href={`/offline/${r.id}`}
                className="flex items-center gap-3 p-3 hover:bg-slate-50"
              >
                <span className="w-12 font-mono text-sm font-semibold text-slate-700">
                  #{String(r.numero).padStart(3, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-800">
                    {r.obraNome}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {r.solicitanteNome} · {r.itens.length} item(s)
                  </span>
                </span>
                <span className="badge text-slate-600">
                  {STATUS_LABEL[r.status as Status] ?? r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
