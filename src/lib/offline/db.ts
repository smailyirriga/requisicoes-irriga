"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ItemCatalogoOffline,
  RascunhoLocal,
  RequisicaoOffline,
} from "./tipos";

interface AppDB extends DBSchema {
  meta: {
    key: string;
    value: unknown;
  };
  catalogo: {
    key: string;
    value: ItemCatalogoOffline;
    indexes: { "por-descricao": string };
  };
  requisicoes: {
    key: string;
    value: RequisicaoOffline;
  };
  rascunhos: {
    key: string; // clienteRef
    value: RascunhoLocal;
  };
}

let dbp: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB indisponível");
  }
  if (!dbp) {
    dbp = openDB<AppDB>("requisicoes-irriga", 1, {
      upgrade(db) {
        db.createObjectStore("meta");
        const cat = db.createObjectStore("catalogo", { keyPath: "id" });
        cat.createIndex("por-descricao", "descricao");
        db.createObjectStore("requisicoes", { keyPath: "id" });
        db.createObjectStore("rascunhos", { keyPath: "clienteRef" });
      },
    });
  }
  return dbp;
}

/* -------- meta -------- */
export async function setMeta(chave: string, valor: unknown) {
  const db = await getDB();
  await db.put("meta", valor, chave);
}
export async function getMeta<T = unknown>(chave: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get("meta", chave)) as T | undefined;
}

/* -------- catálogo -------- */
export async function salvarCatalogo(itens: ItemCatalogoOffline[]) {
  const db = await getDB();
  const tx = db.transaction("catalogo", "readwrite");
  await tx.store.clear();
  for (const it of itens) await tx.store.put(it);
  await tx.done;
}

export async function buscarCatalogoLocal(
  q: string,
  natureza: string,
  limite = 25,
): Promise<ItemCatalogoOffline[]> {
  const db = await getDB();
  const todos = await db.getAll("catalogo");
  const termos = q.toLowerCase().split(/\s+/).filter(Boolean);
  const res: ItemCatalogoOffline[] = [];
  for (const it of todos) {
    if (natureza && it.natureza !== natureza) continue;
    const alvo = `${it.descricao} ${it.codigo ?? ""}`.toLowerCase();
    if (termos.every((t) => alvo.includes(t))) {
      res.push(it);
      if (res.length >= limite) break;
    }
  }
  return res;
}

export async function contarCatalogo() {
  const db = await getDB();
  return db.count("catalogo");
}

/* -------- requisições (cache de leitura) -------- */
export async function salvarRequisicoes(reqs: RequisicaoOffline[]) {
  const db = await getDB();
  const tx = db.transaction("requisicoes", "readwrite");
  for (const r of reqs) await tx.store.put(r);
  await tx.done;
}
export async function salvarRequisicao(r: RequisicaoOffline) {
  const db = await getDB();
  await db.put("requisicoes", r);
}
export async function listarRequisicoesLocais(): Promise<RequisicaoOffline[]> {
  const db = await getDB();
  const todas = await db.getAll("requisicoes");
  return todas.sort((a, b) => (a.data < b.data ? 1 : -1));
}
export async function obterRequisicaoLocal(
  id: string,
): Promise<RequisicaoOffline | undefined> {
  const db = await getDB();
  return db.get("requisicoes", id);
}

/* -------- rascunhos locais -------- */
export async function salvarRascunho(r: RascunhoLocal) {
  const db = await getDB();
  await db.put("rascunhos", r);
}
export async function listarRascunhos(): Promise<RascunhoLocal[]> {
  const db = await getDB();
  const todos = await db.getAll("rascunhos");
  return todos.sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}
export async function obterRascunho(
  clienteRef: string,
): Promise<RascunhoLocal | undefined> {
  const db = await getDB();
  return db.get("rascunhos", clienteRef);
}
export async function removerRascunho(clienteRef: string) {
  const db = await getDB();
  await db.delete("rascunhos", clienteRef);
}
