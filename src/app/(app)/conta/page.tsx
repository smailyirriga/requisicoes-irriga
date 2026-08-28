"use client";

import { useActionState } from "react";
import { alterarMinhaSenha, type EstadoConta } from "@/actions/conta";

export default function ContaPage() {
  const [estado, acao, pend] = useActionState<EstadoConta, FormData>(
    alterarMinhaSenha,
    {},
  );

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Minha conta</h1>
      <form action={acao} className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-slate-600">Alterar senha</h2>
        <div>
          <label className="rotulo">Senha atual</label>
          <input name="atual" type="password" required className="campo" autoComplete="current-password" />
        </div>
        <div>
          <label className="rotulo">Nova senha</label>
          <input name="nova" type="password" required className="campo" autoComplete="new-password" />
        </div>
        <div>
          <label className="rotulo">Confirmar nova senha</label>
          <input name="confirma" type="password" required className="campo" autoComplete="new-password" />
        </div>
        {estado.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
        {estado.ok && <p className="text-sm text-emerald-700">{estado.ok}</p>}
        <button className="btn-primary" disabled={pend}>
          {pend ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
