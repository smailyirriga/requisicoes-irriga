"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "@/actions/sessao";

const inicial: EstadoLogin = {};

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(entrar, inicial);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-700 text-lg font-bold text-white">
            IE
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Requisições de Compra</h1>
          <p className="text-sm text-slate-500">IRRIGA ENGENHARIA</p>
        </div>

        <form action={acao} className="space-y-4">
          <div>
            <label className="rotulo" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="campo"
              placeholder="voce@irriga.local"
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="campo"
            />
          </div>

          {estado.erro && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {estado.erro}
            </p>
          )}

          <button type="submit" disabled={pendente} className="btn-primary w-full">
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
