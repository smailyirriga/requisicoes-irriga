"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listarRascunhos,
  listarRequisicoesLocais,
  obterRascunho,
  removerRascunho,
} from "@/lib/offline/db";
import { sincronizar } from "@/lib/offline/sync";
import { RequisicaoForm, type ItemForm } from "@/components/requisicao-form";
import { NATUREZAS, STATUS_LABEL, type Status } from "@/lib/constantes";
import { dataBR, numeroBR, numReq } from "@/lib/formato";
import type { RascunhoLocal, RequisicaoOffline } from "@/lib/offline/tipos";

export default function OfflinePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-slate-400">Carregando…</p>}>
      <OfflineHub />
    </Suspense>
  );
}

function novoKey() {
  return Math.random().toString(36).slice(2);
}

function OfflineHub() {
  const router = useRouter();
  const params = useSearchParams();
  const modoNovo = params.get("novo") === "1";
  const refEditar = params.get("ref");
  const sel = params.get("sel");
  const ficar = params.get("ficar") === "1";

  const [online, setOnline] = useState(false);
  const [checou, setChecou] = useState(false);

  // Online + sem intenção explícita de ficar aqui → vai para o app normal.
  useEffect(() => {
    const on = navigator.onLine;
    setOnline(on);
    setChecou(true);
    if (on && !ficar && !modoNovo && !refEditar && !sel) {
      router.replace("/");
    }
  }, [router, ficar, modoNovo, refEditar, sel]);

  if (!checou) return <p className="p-4 text-sm text-slate-400">Abrindo…</p>;

  if (modoNovo || refEditar) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Link href="/offline?ficar=1" className="text-sm text-sky-700 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">
          {refEditar ? "Editar rascunho" : "Nova requisição"}
        </h1>
        {!online && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sem internet. A requisição fica salva no aparelho e é enviada quando o
            sinal voltar.
          </p>
        )}
        {refEditar ? (
          <EditarRascunho refId={refEditar} />
        ) : (
          <RequisicaoForm obras={[]} naturezas={NATUREZAS} />
        )}
      </div>
    );
  }

  return <Lista online={online} selInicial={sel} />;
}

function Lista({
  online,
  selInicial,
}: {
  online: boolean;
  selInicial: string | null;
}) {
  const [rascunhos, setRascunhos] = useState<RascunhoLocal[]>([]);
  const [reqs, setReqs] = useState<RequisicaoOffline[]>([]);
  const [q, setQ] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [sel, setSel] = useState<string | null>(selInicial);
  const [sincronizando, setSincronizando] = useState(false);

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
    carregar();
  }, []);

  const selecionada = useMemo(
    () => reqs.find((r) => r.id === sel) ?? null,
    [reqs, sel],
  );

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

  if (selecionada) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <button
          onClick={() => setSel(null)}
          className="text-sm text-sky-700 hover:underline"
        >
          ← Voltar à lista
        </button>
        <Detalhe req={selecionada} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">
          {online ? "Requisições no aparelho" : "Modo offline"}
        </h1>
        <Link href="/" className="text-sm text-sky-700 hover:underline">
          {online ? "Abrir app" : "Tentar conectar"}
        </Link>
      </div>

      {!online && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sem internet. Você pode criar requisições e consultar o que já foi baixado —
          tudo é enviado quando o sinal voltar.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/offline?novo=1" className="btn-primary">
          + Nova requisição
        </Link>
        {online && (
          <button
            className="btn-secondary"
            disabled={sincronizando}
            onClick={async () => {
              setSincronizando(true);
              await sincronizar();
              await carregar();
              setSincronizando(false);
            }}
          >
            {sincronizando ? "Sincronizando…" : "Sincronizar"}
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
              <div key={r.clienteRef} className="p-3">
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
                  {r.payload.itens.length} item(s){r.erro ? ` · ${r.erro}` : ""}
                </p>
                <div className="mt-1.5 flex gap-3 text-xs">
                  <Link
                    href={`/offline?ref=${r.clienteRef}`}
                    className="font-medium text-sky-700 hover:underline"
                  >
                    Abrir / editar
                  </Link>
                  <button
                    className="font-medium text-rose-600 hover:underline"
                    onClick={async () => {
                      if (!confirm("Excluir este rascunho do aparelho?")) return;
                      await removerRascunho(r.clienteRef);
                      carregar();
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
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
            Nenhuma requisição baixada. Abra o app com internet ao menos uma vez.
          </p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {filtradas.map((r) => (
              <button
                key={r.id}
                onClick={() => setSel(r.id)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50"
              >
                <span className="w-12 font-mono text-sm font-semibold text-slate-700">
                  {numReq(r.numero)}
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
              </button>
            ))}
          </div>
        )}
      </section>
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
      <p className="card p-4 text-sm text-slate-600">
        Rascunho não encontrado (pode já ter sido enviado).
      </p>
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
  );
}

function Detalhe({ req }: { req: RequisicaoOffline }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          Requisição {numReq(req.numero)}
          <span className="badge text-slate-600">
            {STATUS_LABEL[req.status as Status] ?? req.status}
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          {req.obraNome} · {req.solicitanteNome} · {dataBR(req.data)}
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
              {numeroBR(it.quantidade)} {it.unidade ?? ""}
              {it.codigo && it.codigo !== "CADASTRAR" ? ` · cód. ${it.codigo}` : ""}
              {it.dataDesejavel ? ` · desejável: ${dataBR(it.dataDesejavel)}` : ""}
            </p>
            {it.observacoes && (
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                Obs.: {it.observacoes}
              </p>
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
