"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { enviarFeedback, type EstadoFeedback } from "@/actions/feedback";

export function BotaoFeedback() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pend] = useActionState<EstadoFeedback, FormData>(
    enviarFeedback,
    {},
  );

  useEffect(() => {
    if (estado.ok) {
      const t = setTimeout(() => setAberto(false), 1400);
      return () => clearTimeout(t);
    }
  }, [estado.ok]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-4 right-4 z-30 rounded-full bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-900"
        aria-label="Enviar sugestão"
      >
        💬 Sugestão
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setAberto(false)}
        >
          <div
            className="card w-full max-w-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Sugestão / problema
              </h2>
              <button
                onClick={() => setAberto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Ajuda a validar o app. Diga o que está bom, o que falta ou o que confunde.
            </p>

            {estado.ok ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-4 text-center text-sm text-emerald-700">
                Recebido, obrigado!
              </p>
            ) : (
              <form action={acao} className="space-y-3">
                <input type="hidden" name="pagina" value={pathname} />
                <div>
                  <label className="rotulo">Tipo</label>
                  <select name="tipo" className="campo" defaultValue="SUGESTAO">
                    <option value="SUGESTAO">Sugestão / falta algo</option>
                    <option value="PROBLEMA">Problema / erro</option>
                    <option value="DUVIDA">Dúvida</option>
                  </select>
                </div>
                <div>
                  <label className="rotulo">Mensagem</label>
                  <textarea name="texto" rows={4} required className="campo" autoFocus />
                </div>
                {estado.erro && (
                  <p className="text-sm text-rose-700">{estado.erro}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={pend}>
                    {pend ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
