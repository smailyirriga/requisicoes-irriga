"use client";

import Link from "next/link";
import { useOffline } from "./provider";

function tempoRelativo(ts: number | null) {
  if (!ts) return "nunca";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  return `há ${Math.round(s / 86400)} d`;
}

export function BarraStatusOffline() {
  const { online, pendentes, comErro, sincronizadoEm, sincronizando, sincronizarAgora } =
    useOffline();

  // Nada a mostrar: online, sincronizado e sem pendências
  if (online && pendentes === 0 && !sincronizando) return null;

  const cor = !online
    ? "bg-amber-100 text-amber-900"
    : comErro > 0
      ? "bg-rose-100 text-rose-900"
      : "bg-sky-100 text-sky-900";

  return (
    <div className={`${cor} border-b border-black/5`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-xs">
        <span className="font-semibold">
          {!online ? "● Offline" : sincronizando ? "↻ Sincronizando…" : "● Online"}
        </span>
        {pendentes > 0 && (
          <Link href="/rascunhos" className="underline">
            {pendentes} {pendentes === 1 ? "requisição" : "requisições"} não enviada
            {pendentes === 1 ? "" : "s"}
            {comErro > 0 ? ` (${comErro} com erro)` : ""}
          </Link>
        )}
        {online && (
          <span className="text-black/50">
            última sincronização {tempoRelativo(sincronizadoEm)}
          </span>
        )}
        {online && !sincronizando && (
          <button
            onClick={() => void sincronizarAgora()}
            className="ml-auto rounded bg-white/70 px-2 py-0.5 font-medium hover:bg-white"
          >
            Sincronizar agora
          </button>
        )}
      </div>
    </div>
  );
}
