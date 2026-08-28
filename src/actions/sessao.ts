"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { conferirSenha, criarSessao, encerrarSessao } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().min(3, "Informe o e-mail"),
  senha: z.string().min(1, "Informe a senha"),
});

export type EstadoLogin = { erro?: string };

export async function entrar(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.ativo || !(await conferirSenha(parsed.data.senha, user.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await criarSessao(user.id);
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
