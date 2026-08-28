"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listarRascunhos } from "@/lib/offline/db";
import type { RascunhoLocal } from "@/lib/offline/tipos";

export function RascunhosWidget() {
  const [lista, setLista] = useState<RascunhoLocal[]>([]);

  useEffect(() => {
    listarRascunhos()
      .then(setLista)
      .catch(() => {});
  }, []);

  if (lista.length === 0) return null;

  return (
    <Link
      href="/rascunhos"
      className="card block border-amber-200 bg-amber-50 p-3 hover:bg-amber-100"
    >
      <p className="text-sm font-semibold text-amber-900">
        {lista.length} {lista.length === 1 ? "rascunho não enviado" : "rascunhos não enviados"} neste aparelho
      </p>
      <p className="text-xs text-amber-800">
        Toque para revisar e enviar.
      </p>
    </Link>
  );
}
