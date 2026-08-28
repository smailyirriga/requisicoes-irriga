"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { obterRascunho } from "@/lib/offline/db";
import { RequisicaoForm, type ItemForm } from "@/components/requisicao-form";
import { NATUREZAS } from "@/lib/constantes";
import type { RascunhoLocal } from "@/lib/offline/tipos";

function novoKey() {
  return Math.random().toString(36).slice(2);
}

export default function EditarRascunhoLocal({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = use(params);
  const [rascunho, setRascunho] = useState<RascunhoLocal | null | undefined>(
    undefined,
  );

  useEffect(() => {
    obterRascunho(ref).then((r) => setRascunho(r ?? null));
  }, [ref]);

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
        <h1 className="mt-1 text-xl font-semibold text-slate-800">
          Editar rascunho
        </h1>
      </div>
      <RequisicaoForm
        obras={[]}
        naturezas={NATUREZAS}
        rascunhoLocalRef={ref}
        inicial={{
          id: ref,
          obraId: rascunho.payload.obraId,
          observacaoGeral: rascunho.payload.observacaoGeral ?? "",
          itens,
        }}
      />
    </div>
  );
}
