"use client";

import { useActionState } from "react";
import {
  criarObra,
  criarUsuario,
  type EstadoAdmin,
} from "@/actions/admin";
import { PAPEIS, PAPEL_LABEL } from "@/lib/constantes";

export function FormNovaObra() {
  const [estado, acao, pend] = useActionState<EstadoAdmin, FormData>(criarObra, {});
  return (
    <form action={acao} className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-slate-600">Nova obra</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="rotulo">Nome da obra</label>
          <input name="nome" required className="campo" placeholder="RAÍZEN VALE DO ROSÁRIO - MORRO AGUDO/SP" />
        </div>
        <div>
          <label className="rotulo">Código (opcional)</label>
          <input name="codigo" className="campo" />
        </div>
      </div>
      <div>
        <label className="rotulo">Cidade/UF (opcional)</label>
        <input name="cidadeUf" className="campo" placeholder="MORRO AGUDO/SP" />
      </div>
      {estado.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
      {estado.ok && <p className="text-sm text-emerald-700">{estado.ok}</p>}
      <button className="btn-primary" disabled={pend}>
        {pend ? "Salvando..." : "Cadastrar obra"}
      </button>
    </form>
  );
}

export function FormNovoUsuario() {
  const [estado, acao, pend] = useActionState<EstadoAdmin, FormData>(criarUsuario, {});
  return (
    <form action={acao} className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-slate-600">Novo usuário</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="rotulo">Nome</label>
          <input name="nome" required className="campo" />
        </div>
        <div>
          <label className="rotulo">E-mail</label>
          <input name="email" type="email" required className="campo" />
        </div>
        <div>
          <label className="rotulo">Papel</label>
          <select name="papel" className="campo" defaultValue="SOLICITANTE">
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {PAPEL_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo">Senha inicial</label>
          <input name="senha" required className="campo" defaultValue="123456" />
        </div>
      </div>
      {estado.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
      {estado.ok && <p className="text-sm text-emerald-700">{estado.ok}</p>}
      <button className="btn-primary" disabled={pend}>
        {pend ? "Salvando..." : "Criar usuário"}
      </button>
    </form>
  );
}
