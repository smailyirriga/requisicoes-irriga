"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarValores } from "@/actions/requisicoes";
import { moedaBR, numeroBR } from "@/lib/formato";

type Linha = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string | null;
  valorUnitario: number | null;
  fornecedor: string | null;
  statusItem: string | null;
};

const STATUS_ITEM = ["", "PENDENTE", "COMPRADO", "RECEBIDO", "CANCELADO"];

export function ValoresForm({ id, itens }: { id: string; itens: Linha[] }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState(
    itens.map((it) => ({
      ...it,
      valorUnitario: it.valorUnitario != null ? String(it.valorUnitario) : "",
      fornecedor: it.fornecedor ?? "",
      statusItem: it.statusItem ?? "",
    })),
  );
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  function patch(i: number, campo: string, v: string) {
    setLinhas((xs) => xs.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
    setOk(false);
  }

  function salvar() {
    start(async () => {
      await salvarValores(id, {
        itens: linhas.map((l) => ({
          id: l.id,
          valorUnitario: l.valorUnitario ? Number(String(l.valorUnitario).replace(",", ".")) : null,
          fornecedor: l.fornecedor || null,
          statusItem: l.statusItem || null,
        })),
      });
      setOk(true);
      router.refresh();
    });
  }

  const total = linhas.reduce((s, l) => {
    const v = Number(String(l.valorUnitario).replace(",", "."));
    return s + (Number.isFinite(v) ? v * l.quantidade : 0);
  }, 0);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">
          Compra — valores e fornecedores
        </h2>
        <span className="text-sm font-semibold text-slate-700">
          Total estimado: {moedaBR(total)}
        </span>
      </div>

      <div className="space-y-3">
        {linhas.map((l, i) => (
          <div key={l.id} className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-sm text-slate-700">
              {l.descricao}{" "}
              <span className="text-slate-400">
                ({numeroBR(l.quantidade)} {l.unidade ?? ""})
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <label className="rotulo">Valor unit. (R$)</label>
                <input
                  className="campo"
                  inputMode="decimal"
                  value={l.valorUnitario}
                  onChange={(e) => patch(i, "valorUnitario", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="rotulo">Fornecedor</label>
                <input
                  className="campo"
                  value={l.fornecedor}
                  onChange={(e) => patch(i, "fornecedor", e.target.value)}
                />
              </div>
              <div>
                <label className="rotulo">Situação</label>
                <select
                  className="campo"
                  value={l.statusItem}
                  onChange={(e) => patch(i, "statusItem", e.target.value)}
                >
                  {STATUS_ITEM.map((s) => (
                    <option key={s} value={s}>
                      {s || "—"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending} onClick={salvar}>
          {pending ? "Salvando..." : "Salvar valores"}
        </button>
        {ok && <span className="text-sm text-emerald-700">Salvo!</span>}
      </div>
    </div>
  );
}
