"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executarAcao, excluirRascunho } from "@/actions/requisicoes";
import { ACAO_LABEL, type Acao } from "@/lib/fluxo";

const ESTILO: Record<string, string> = {
  APROVAR: "btn-success",
  RECUSAR: "btn-danger",
  ENVIAR: "btn-primary",
  INICIAR_COMPRA: "btn-primary",
  MARCAR_RECEBIDA: "btn-success",
  REABRIR: "btn-secondary",
  CANCELAR: "btn-secondary",
  CANCELAR_ADMIN: "btn-secondary",
};

export function AcoesRequisicao({
  id,
  acoes,
  podeExcluir,
}: {
  id: string;
  acoes: Acao[];
  podeExcluir: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmar, setConfirmar] = useState<Acao | null>(null);
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function rodar(acao: Acao, comNota: boolean) {
    if (comNota && confirmar !== acao) {
      setConfirmar(acao);
      return;
    }
    setErro(null);
    const fd = new FormData();
    fd.set("acao", acao);
    if (nota.trim()) fd.set("nota", nota.trim());
    start(async () => {
      try {
        await executarAcao(id, fd);
        setConfirmar(null);
        setNota("");
        router.refresh();
      } catch (e: any) {
        setErro(e?.message ?? "Erro");
      }
    });
  }

  if (acoes.length === 0 && !podeExcluir) return null;

  return (
    <div className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-slate-600">Ações</h2>
      <div className="flex flex-wrap gap-2">
        {acoes.map((a) => {
          const precisaNota = a === "RECUSAR";
          return (
            <button
              key={a}
              className={ESTILO[a] ?? "btn-secondary"}
              disabled={pending}
              onClick={() => rodar(a, precisaNota)}
            >
              {ACAO_LABEL[a]}
            </button>
          );
        })}
        {podeExcluir && (
          <button
            className="btn-secondary"
            disabled={pending}
            onClick={() => {
              if (confirm("Excluir este rascunho? Esta ação não pode ser desfeita."))
                start(() => excluirRascunho(id));
            }}
          >
            Excluir rascunho
          </button>
        )}
      </div>

      {confirmar && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <label className="rotulo">
            {confirmar === "RECUSAR" ? "Motivo da recusa (obrigatório)" : "Observação (opcional)"}
          </label>
          <textarea
            className="campo"
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className={ESTILO[confirmar]}
              disabled={pending || (confirmar === "RECUSAR" && !nota.trim())}
              onClick={() => rodar(confirmar, false)}
            >
              Confirmar
            </button>
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() => {
                setConfirmar(null);
                setNota("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p className="text-sm text-rose-700">{erro}</p>}
    </div>
  );
}
