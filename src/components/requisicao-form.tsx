"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarRequisicao, atualizarRequisicao } from "@/actions/requisicoes";
import { CODIGO_A_CADASTRAR } from "@/lib/constantes";
import { useOffline } from "@/components/offline/provider";
import { buscarCatalogoLocal } from "@/lib/offline/db";
import { guardarRascunhoLocal } from "@/lib/offline/sync";
import type { RascunhoPayload } from "@/lib/offline/tipos";

type ObraOpt = { id: string; nome: string };
type CatalogoItem = {
  id: string;
  codigo: string | null;
  descricao: string;
  natureza: string | null;
  unidade: string | null;
  prazoEntrega: string | null;
  pendente: boolean;
};

export type ItemForm = {
  key: string;
  itemCatalogoId: string | null;
  finalidade: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  dataDesejavel: string;
  observacoes: string;
  codigo: string;
  prazoEstimado: string;
};

type Props = {
  obras: ObraOpt[];
  naturezas: string[];
  inicial?: {
    id: string;
    obraId: string;
    observacaoGeral: string;
    itens: ItemForm[];
  };
  /** Quando editando um rascunho que está só no aparelho (offline). */
  rascunhoLocalRef?: string;
};

function novoKey() {
  return Math.random().toString(36).slice(2);
}

function itemVazio(): ItemForm {
  return {
    key: novoKey(),
    itemCatalogoId: null,
    finalidade: "",
    descricao: "",
    quantidade: "1",
    unidade: "",
    dataDesejavel: "",
    observacoes: "",
    codigo: "",
    prazoEstimado: "",
  };
}

export function RequisicaoForm({
  obras: obrasProp,
  naturezas,
  inicial,
  rascunhoLocalRef,
}: Props) {
  const router = useRouter();
  const { online, sincronizarAgora, atualizarPendentes } = useOffline();
  const editandoLocal = rascunhoLocalRef !== undefined;
  const editandoServidor = !!inicial && !editandoLocal;

  const [obras, setObras] = useState<ObraOpt[]>(obrasProp);
  const [obraId, setObraId] = useState(
    inicial?.obraId ?? obrasProp[0]?.id ?? "",
  );
  const [obrasCarregando, setObrasCarregando] = useState(obrasProp.length === 0);
  const [obs, setObs] = useState(inicial?.observacaoGeral ?? "");
  const [itens, setItens] = useState<ItemForm[]>(inicial?.itens ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Carrega as obras de forma resiliente: cópia local (offline) + API (online).
  useEffect(() => {
    if (obrasProp.length > 0) return;
    let vivo = true;
    (async () => {
      const { obterObrasLocais } = await import("@/lib/offline/sync");
      const { setMeta } = await import("@/lib/offline/db");
      const locais = await obterObrasLocais().catch(() => []);
      if (vivo && locais.length) {
        setObras(locais);
        setObraId((atual) => atual || locais[0].id);
        setObrasCarregando(false);
      }
      if (navigator.onLine) {
        try {
          const r = await fetch("/api/obras", { cache: "no-store" });
          if (r.ok) {
            const j = (await r.json()) as { obras: ObraOpt[] };
            if (vivo && j.obras?.length) {
              setObras(j.obras);
              setObraId((atual) => atual || j.obras[0].id);
              await setMeta("obras", j.obras).catch(() => {});
            }
          }
        } catch {
          /* offline — segue com a cópia local */
        }
      }
      if (vivo) setObrasCarregando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [obrasProp.length]);

  function addDoCatalogo(c: CatalogoItem) {
    setItens((xs) => [
      ...xs,
      {
        ...itemVazio(),
        itemCatalogoId: c.pendente ? null : c.id,
        descricao: c.descricao,
        unidade: c.unidade ?? "",
        codigo: c.codigo ?? "",
        prazoEstimado: c.prazoEntrega ?? "",
      },
    ]);
  }

  function addManual() {
    setItens((xs) => [...xs, { ...itemVazio(), codigo: CODIGO_A_CADASTRAR }]);
  }

  function patch(key: string, campo: keyof ItemForm, valor: string) {
    setItens((xs) =>
      xs.map((it) => (it.key === key ? { ...it, [campo]: valor } : it)),
    );
  }

  function remover(key: string) {
    setItens((xs) => xs.filter((it) => it.key !== key));
  }

  function submeter(enviar: boolean) {
    setErro(null);
    if (!obraId) return setErro("Selecione a obra.");
    if (itens.length === 0) return setErro("Adicione ao menos um item.");
    for (const it of itens) {
      if (!it.finalidade.trim()) return setErro("Preencha a finalidade de todos os itens.");
      if (!it.descricao.trim()) return setErro("Preencha a descrição de todos os itens.");
      if (!(Number(it.quantidade.replace(",", ".")) > 0))
        return setErro(`Quantidade inválida no item "${it.descricao || "novo"}".`);
    }

    const itensDTO = itens.map((it) => ({
      itemCatalogoId: it.itemCatalogoId,
      finalidade: it.finalidade.trim(),
      descricao: it.descricao.trim(),
      quantidade: Number(it.quantidade.replace(",", ".")),
      unidade: it.unidade.trim() || null,
      dataDesejavel: it.dataDesejavel || null,
      observacoes: it.observacoes.trim() || null,
      codigo: it.codigo.trim() || null,
      prazoEstimado: it.prazoEstimado.trim() || null,
    }));
    const payloadOffline: RascunhoPayload = {
      obraId,
      observacaoGeral: obs.trim() || null,
      itens: itensDTO,
    };
    const obraNome = obras.find((o) => o.id === obraId)?.nome;

    async function guardarLocal(motivo?: string) {
      await guardarRascunhoLocal(
        rascunhoLocalRef ?? null,
        payloadOffline,
        enviar ? "ENVIAR" : "RASCUNHO",
        obraNome,
      );
      await atualizarPendentes();
      if (enviar && navigator.onLine) {
        const r = await sincronizarAgora();
        // Enviou com sucesso estando online → volta para a lista principal.
        if (r && r.erros === 0 && navigator.onLine) {
          router.push("/");
          router.refresh();
          return motivo;
        }
      }
      router.push("/offline?ficar=1");
      router.refresh();
      return motivo;
    }

    startTransition(async () => {
      try {
        // 1) Editando um rascunho que só existe no aparelho
        if (editandoLocal) {
          await guardarLocal();
          return;
        }
        // 2) Editando uma requisição que já está no servidor — precisa de internet
        if (editandoServidor) {
          if (!navigator.onLine) {
            setErro("Sem internet. Só dá para editar esta requisição quando conectar.");
            return;
          }
          await atualizarRequisicao(inicial!.id, { ...payloadOffline, enviar });
          return;
        }
        // 3) Requisição nova
        if (navigator.onLine) {
          await criarRequisicao({ ...payloadOffline, enviar });
          return;
        }
        await guardarLocal();
      } catch (e: any) {
        if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
        // Falha de rede ao criar online → salva no aparelho para enviar depois
        if (!editandoLocal && !editandoServidor && !navigator.onLine) {
          await guardarLocal();
          return;
        }
        setErro(e?.message ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="rotulo">Obra</label>
            <select
              className="campo"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
            >
              {obras.length === 0 && (
                <option value="">
                  {obrasCarregando ? "Carregando obras..." : "Nenhuma obra disponível"}
                </option>
              )}
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            {obras.length === 0 && !obrasCarregando && (
              <p className="mt-1 text-xs text-amber-600">
                Abra o app com internet ao menos uma vez para baixar a lista de obras.
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="rotulo">Observações gerais da requisição (opcional)</label>
          <textarea
            className="campo"
            rows={2}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex.: entrega no canteiro com o motorista X..."
          />
        </div>
      </div>

      <BuscaCatalogo naturezas={naturezas} onAdd={addDoCatalogo} onManual={addManual} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600">
          Itens ({itens.length})
        </h2>
        {itens.length === 0 && (
          <p className="card p-4 text-center text-sm text-slate-500">
            Nenhum item ainda. Busque no catálogo acima ou adicione um item fora do
            catálogo.
          </p>
        )}
        {itens.map((it, idx) => (
          <ItemCard
            key={it.key}
            n={idx + 1}
            item={it}
            onPatch={patch}
            onRemove={() => remover(it.key)}
          />
        ))}
      </div>

      {erro && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>
      )}

      {!online && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Você está offline. A requisição fica salva no aparelho e é enviada
          automaticamente quando o sinal voltar.
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-slate-200 bg-background/95 py-3 backdrop-blur">
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() => submeter(false)}
        >
          {pending
            ? "Salvando..."
            : editandoServidor
              ? "Salvar alterações"
              : "Salvar rascunho"}
        </button>
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() => submeter(true)}
        >
          {pending
            ? "Enviando..."
            : online
              ? "Salvar e enviar para aprovação"
              : "Salvar para enviar depois"}
        </button>
      </div>
    </div>
  );
}

function BuscaCatalogo({
  naturezas,
  onAdd,
  onManual,
}: {
  naturezas: string[];
  onAdd: (c: CatalogoItem) => void;
  onManual: () => void;
}) {
  const [q, setQ] = useState("");
  const [natureza, setNatureza] = useState("");
  const [res, setRes] = useState<CatalogoItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2 && !natureza) {
      setRes([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setCarregando(true);
      try {
        if (navigator.onLine) {
          const p = new URLSearchParams();
          if (q.trim()) p.set("q", q.trim());
          if (natureza) p.set("natureza", natureza);
          const r = await fetch(`/api/catalogo?${p.toString()}`);
          if (r.ok) {
            const j = await r.json();
            setRes(j.itens ?? []);
            return;
          }
        }
        // offline (ou API indisponível): busca no catálogo baixado
        setRes(await buscarCatalogoLocal(q.trim(), natureza));
      } catch {
        try {
          setRes(await buscarCatalogoLocal(q.trim(), natureza));
        } catch {
          setRes([]);
        }
      } finally {
        setCarregando(false);
      }
    }, 250);
  }, [q, natureza]);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <label className="rotulo">Buscar item no catálogo</label>
          <input
            className="campo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="descrição ou código (ex.: luva vaqueta, 472)"
          />
        </div>
        <div>
          <label className="rotulo">Natureza</label>
          <select
            className="campo"
            value={natureza}
            onChange={(e) => setNatureza(e.target.value)}
          >
            <option value="">Todas</option>
            {naturezas.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-secondary" onClick={onManual}>
          + Item fora do catálogo
        </button>
      </div>

      {carregando && <p className="text-xs text-slate-400">Buscando...</p>}
      {!carregando && res.length > 0 && (
        <ul className="max-h-72 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200">
          {res.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 p-2.5 text-left hover:bg-sky-50"
                onClick={() => onAdd(c)}
              >
                <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-slate-500">
                  {c.pendente || !c.codigo ? "—" : c.codigo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-800">{c.descricao}</span>
                  <span className="block text-xs text-slate-400">
                    {[c.natureza, c.unidade, c.prazoEntrega].filter(Boolean).join(" · ")}
                    {c.pendente ? " · (código a cadastrar)" : ""}
                  </span>
                </span>
                <span className="text-sky-700">+</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!carregando && (q.trim().length >= 2 || natureza) && res.length === 0 && (
        <p className="text-xs text-slate-400">
          Nada encontrado. Use “+ Item fora do catálogo”.
        </p>
      )}
    </div>
  );
}

function ItemCard({
  n,
  item,
  onPatch,
  onRemove,
}: {
  n: number;
  item: ItemForm;
  onPatch: (key: string, campo: keyof ItemForm, valor: string) => void;
  onRemove: () => void;
}) {
  const doCatalogo = !!item.itemCatalogoId;
  return (
    <div className="card space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          Item {n}
          {item.codigo && item.codigo !== CODIGO_A_CADASTRAR ? (
            <span className="ml-2 font-mono text-slate-400">cód. {item.codigo}</span>
          ) : (
            <span className="ml-2 text-amber-600">a cadastrar</span>
          )}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-rose-600 hover:underline"
        >
          Remover
        </button>
      </div>

      <div>
        <label className="rotulo">Finalidade / local na obra</label>
        <input
          className="campo"
          value={item.finalidade}
          onChange={(e) => onPatch(item.key, "finalidade", e.target.value)}
          placeholder="Ex.: Alambrado canteiro de obra"
        />
      </div>

      <div>
        <label className="rotulo">Descrição do material/peça</label>
        <textarea
          className="campo"
          rows={2}
          value={item.descricao}
          onChange={(e) => onPatch(item.key, "descricao", e.target.value)}
          readOnly={doCatalogo}
        />
        {doCatalogo && (
          <p className="mt-1 text-xs text-slate-400">
            Descrição travada (item do catálogo).
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="rotulo">Qtde</label>
          <input
            className="campo"
            inputMode="decimal"
            value={item.quantidade}
            onChange={(e) => onPatch(item.key, "quantidade", e.target.value)}
          />
        </div>
        <div>
          <label className="rotulo">Unid.</label>
          <input
            className="campo"
            value={item.unidade}
            onChange={(e) => onPatch(item.key, "unidade", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="rotulo">Data desejável de entrega</label>
          <input
            type="date"
            className="campo"
            value={item.dataDesejavel}
            onChange={(e) => onPatch(item.key, "dataDesejavel", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="rotulo">Observações do item</label>
        <textarea
          className="campo"
          rows={2}
          value={item.observacoes}
          onChange={(e) => onPatch(item.key, "observacoes", e.target.value)}
        />
      </div>

      {!doCatalogo && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rotulo">Código (se souber)</label>
            <input
              className="campo"
              value={item.codigo === CODIGO_A_CADASTRAR ? "" : item.codigo}
              onChange={(e) => onPatch(item.key, "codigo", e.target.value)}
              placeholder="deixe vazio p/ cadastrar"
            />
          </div>
          <div>
            <label className="rotulo">Prazo estimado</label>
            <input
              className="campo"
              value={item.prazoEstimado}
              onChange={(e) => onPatch(item.key, "prazoEstimado", e.target.value)}
              placeholder="ex.: ±3dd"
            />
          </div>
        </div>
      )}
    </div>
  );
}
