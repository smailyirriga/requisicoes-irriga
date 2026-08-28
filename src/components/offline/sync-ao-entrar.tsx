"use client";

import { useEffect } from "react";
import { useOffline } from "./provider";

/**
 * Dispara uma sincronização ao entrar na área logada do app
 * (o OfflineProvider fica no layout raiz e não re-monta após o login).
 */
export function SyncAoEntrar() {
  const { sincronizarAgora } = useOffline();
  useEffect(() => {
    void sincronizarAgora();
  }, [sincronizarAgora]);
  return null;
}
