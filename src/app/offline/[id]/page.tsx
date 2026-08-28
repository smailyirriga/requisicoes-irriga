"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { obterRequisicaoLocal } from "@/lib/offline/db";
import type { RequisicaoOffline } from "@/lib/offline/tipos";
import { STATUS_LABEL, type Status } from "@/lib/constantes";

export default function DetalheOffline({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [req, setReq] = useState<RequisicaoOffline | null | undefined>(undefined);

  useEffect(() => {
    obterRequisicaoLocal(id).then((r) => setReq(r ?? null));
  }, [id]);

  if (req === undefined)
    return <p className="p-4 text-sm text-slate-400">Carregando…</p>;
  if (req === null)
    return (
      <div className="mx-auto max-w-3xl p-4">
        <p className="card p-4 text-sm text-slate-600">
          Esta requisição não está salva no aparelho. Conecte à internet para vê-la.
        </p>
        <Link href="/offline" className="mt-2 inline-block text-sm text-sky-700 underline">
          ← Voltar
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Link href="/offline" className="text-sm text-sky-700 hover:underline">
        ← Requisições salvas
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          Requisição #{String(req.numero).padStart(3, "0")}
          <span className="badge text-slate-600">
            {STATUS_LABEL[req.status as Status] ?? req.status}
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          {req.obraNome} · {req.solicitanteNome} ·{" "}
          {new Date(req.data).toLocaleDateString("pt-BR")}
        </p>
      </div>

      {req.observacaoGeral && (
        <p className="card p-3 text-sm text-slate-600">{req.observacaoGeral}</p>
      )}

      <div className="card divide-y divide-slate-100">
        {req.itens.map((it, i) => (
          <div key={it.id} className="p-3">
            <p className="text-xs font-semibold text-slate-400">
              {i + 1}. {it.finalidade}
            </p>
            <p className="text-sm text-slate-800">{it.descricao}</p>
            <p className="text-xs text-slate-500">
              {it.quantidade} {it.unidade ?? ""}
              {it.codigo && it.codigo !== "CADASTRAR" ? ` · cód. ${it.codigo}` : ""}
            </p>
            {it.observacoes && (
              <p className="mt-1 text-xs text-slate-500">Obs.: {it.observacoes}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        Cópia offline — pode não refletir mudanças recentes.
      </p>
    </div>
  );
}
