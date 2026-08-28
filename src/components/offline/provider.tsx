"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { listarRascunhos } from "@/lib/offline/db";
import { sincronizar, type ResultadoSync } from "@/lib/offline/sync";

type Ctx = {
  online: boolean;
  pendentes: number;
  comErro: number;
  sincronizadoEm: number | null;
  sincronizando: boolean;
  sincronizarAgora: () => Promise<ResultadoSync | null>;
  atualizarPendentes: () => Promise<void>;
};

const OfflineContext = createContext<Ctx | null>(null);

export function useOffline() {
  const c = useContext(OfflineContext);
  if (!c) throw new Error("useOffline fora do OfflineProvider");
  return c;
}

const INTERVALO_MS = 3 * 60 * 1000;

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [comErro, setComErro] = useState(0);
  const [sincronizadoEm, setSincronizadoEm] = useState<number | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const rodando = useRef(false);
  const router = useRouter();

  const atualizarPendentes = useCallback(async () => {
    try {
      const rs = await listarRascunhos();
      setPendentes(rs.filter((r) => r.estado !== "ENVIADO").length);
      setComErro(rs.filter((r) => r.estado === "ERRO").length);
    } catch {
      /* IndexedDB indisponível */
    }
  }, []);

  const sincronizarAgora = useCallback(async () => {
    if (rodando.current) return null;
    rodando.current = true;
    setSincronizando(true);
    try {
      const r = await sincronizar();
      if (r.baixou) setSincronizadoEm(Date.now());
      setOnline(r.erro !== "sem-conexao");
      await atualizarPendentes();
      return r;
    } finally {
      rodando.current = false;
      setSincronizando(false);
    }
  }, [atualizarPendentes]);

  useEffect(() => {
    setOnline(navigator.onLine);
    atualizarPendentes();
    void sincronizarAgora();

    // mantém o hub offline quentinho no cache
    if (navigator.onLine) {
      try {
        router.prefetch("/offline");
      } catch {
        /* ignore */
      }
    }

    const onOnline = () => {
      setOnline(true);
      void sincronizarAgora();
    };
    const onOffline = () => setOnline(false);
    const onVisibilidade = () => {
      if (document.visibilityState === "visible") void sincronizarAgora();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibilidade);
    const timer = setInterval(() => void sincronizarAgora(), INTERVALO_MS);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibilidade);
      clearInterval(timer);
    };
  }, [atualizarPendentes, sincronizarAgora, router]);

  return (
    <OfflineContext.Provider
      value={{
        online,
        pendentes,
        comErro,
        sincronizadoEm,
        sincronizando,
        sincronizarAgora,
        atualizarPendentes,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
