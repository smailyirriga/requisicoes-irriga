import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./db";
import type { Papel } from "./constantes";

const COOKIE = "sessao";
const DIAS = 30;

function segredo() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não definido no .env");
  return new TextEncoder().encode(s);
}

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(segredo());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DIAS * 24 * 60 * 60,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
};

export const usuarioAtual = cache(async (): Promise<UsuarioSessao | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo());
    const id = payload.sub;
    if (!id) return null;
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u || !u.ativo) return null;
    return { id: u.id, nome: u.nome, email: u.email, papel: u.papel as Papel };
  } catch {
    return null;
  }
});

export async function exigirUsuario(): Promise<UsuarioSessao> {
  const u = await usuarioAtual();
  if (!u) throw new Error("NAO_AUTENTICADO");
  return u;
}

export async function exigirPapel(...papeis: Papel[]): Promise<UsuarioSessao> {
  const u = await exigirUsuario();
  if (!papeis.includes(u.papel) && u.papel !== "ADMIN") {
    throw new Error("SEM_PERMISSAO");
  }
  return u;
}
