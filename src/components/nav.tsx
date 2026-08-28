"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sair } from "@/actions/sessao";
import { PAPEL_LABEL, type Papel } from "@/lib/constantes";
import { useOffline } from "@/components/offline/provider";

type Item = { href: string; hrefOffline?: string; label: string; papeis?: Papel[] };

const ITENS: Item[] = [
  { href: "/", hrefOffline: "/offline?ficar=1", label: "Requisições" },
  { href: "/requisicoes/nova", hrefOffline: "/offline?novo=1", label: "Nova requisição" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/obras", label: "Obras", papeis: ["ADMIN"] },
  { href: "/usuarios", label: "Usuários", papeis: ["ADMIN"] },
  { href: "/sugestoes", label: "Sugestões", papeis: ["ADMIN"] },
];

export function Nav({ nome, papel }: { nome: string; papel: Papel }) {
  const pathname = usePathname();
  const { online } = useOffline();
  const [aberto, setAberto] = useState(false);

  const itens = ITENS.filter((i) => !i.papeis || i.papeis.includes(papel)).map((i) => ({
    ...i,
    href: !online && i.hrefOffline ? i.hrefOffline : i.href,
  }));

  const linkCls = (href: string) => {
    const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      ativo ? "bg-sky-700 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="IRRIGA"
            className="h-8 w-8 rounded-lg"
          />
          <span className="hidden text-sm font-semibold text-slate-800 sm:block">
            Requisições
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {itens.map((i) => (
            <Link key={i.href} href={i.href} className={linkCls(i.href)}>
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Link href="/conta" className="text-right leading-tight hover:opacity-80">
            <div className="text-sm font-medium text-slate-700">{nome}</div>
            <div className="text-xs text-slate-400">{PAPEL_LABEL[papel]}</div>
          </Link>
          <form action={sair}>
            <button className="btn-secondary" type="submit">
              Sair
            </button>
          </form>
        </div>

        <button
          className="btn-secondary ml-auto md:hidden"
          onClick={() => setAberto((v) => !v)}
          aria-label="Menu"
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>

      {aberto && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link
            href="/conta"
            className="mb-2 block text-xs text-slate-400"
            onClick={() => setAberto(false)}
          >
            {nome} · {PAPEL_LABEL[papel]} — minha conta
          </Link>
          <div className="space-y-1" onClick={() => setAberto(false)}>
            {itens.map((i) => (
              <Link key={i.href} href={i.href} className={linkCls(i.href)}>
                {i.label}
              </Link>
            ))}
          </div>
          <form action={sair} className="mt-3">
            <button className="btn-secondary w-full" type="submit">
              Sair
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
