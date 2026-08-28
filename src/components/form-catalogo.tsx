"use client";

import { useActionState } from "react";
import { criarItemCatalogo, type EstadoCatalogo } from "@/actions/catalogo";
import { NATUREZAS, UNIDADES } from "@/lib/constantes";

export function FormNovoItemCatalogo() {
  const [estado, acao, pend] = useActionState<EstadoCatalogo, FormData>(
    criarItemCatalogo,
    {},
  );
  return (
    <form action={acao} className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-slate-600">Adicionar item ao catálogo</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="rotulo">Código IRRIGA (deixe vazio se ainda não tem)</label>
          <input name="codigo" className="campo" />
        </div>
        <div>
          <label className="rotulo">Unidade</label>
          <input name="unidade" list="unidades" className="campo" />
          <datalist id="unidades">
            {UNIDADES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </div>
      <div>
        <label className="rotulo">Descrição</label>
        <textarea name="descricao" rows={2} required className="campo" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="rotulo">Natureza</label>
          <select name="natureza" className="campo" defaultValue="">
            <option value="">—</option>
            {NATUREZAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo">Prazo de entrega</label>
          <input name="prazoEntrega" className="campo" placeholder="ex.: ±3dd / a ver" />
        </div>
      </div>
      {estado.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
      {estado.ok && <p className="text-sm text-emerald-700">{estado.ok}</p>}
      <button className="btn-primary" disabled={pend}>
        {pend ? "Salvando..." : "Adicionar"}
      </button>
    </form>
  );
}
