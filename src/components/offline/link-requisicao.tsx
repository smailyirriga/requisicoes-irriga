"use client";

import Link from "next/link";
import { useOffline } from "./provider";

/**
 * Link para o detalhe da requisição. Online vai para a tela completa;
 * offline vai para a cópia local (tela /offline).
 */
export function LinkRequisicao({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { online } = useOffline();
  const href = online ? `/requisicoes/${id}` : `/offline?sel=${id}`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
