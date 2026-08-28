"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario, conferirSenha, hashSenha } from "@/lib/auth";

const schema = z
  .object({
    atual: z.string().min(1, "Informe a senha atual"),
    nova: z.string().min(6, "A nova senha precisa ter ao menos 6 caracteres").max(100),
    confirma: z.string(),
  })
  .refine((d) => d.nova === d.confirma, {
    message: "A confirmação não confere",
    path: ["confirma"],
  });

export type EstadoConta = { erro?: string; ok?: string };

export async function alterarMinhaSenha(
  _prev: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  const u = await exigirUsuario();
  const parsed = schema.safeParse({
    atual: formData.get("atual"),
    nova: formData.get("nova"),
    confirma: formData.get("confirma"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const dbUser = await prisma.user.findUnique({ where: { id: u.id } });
  if (!dbUser || !(await conferirSenha(parsed.data.atual, dbUser.senhaHash))) {
    return { erro: "Senha atual incorreta." };
  }

  await prisma.user.update({
    where: { id: u.id },
    data: { senhaHash: await hashSenha(parsed.data.nova) },
  });
  return { ok: "Senha alterada." };
}
