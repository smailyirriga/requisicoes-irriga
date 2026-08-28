"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario, exigirPapel } from "@/lib/auth";

const schema = z.object({
  texto: z.string().trim().min(3, "Escreva sua sugestão").max(4000),
  pagina: z.string().trim().max(200).optional(),
  tipo: z.enum(["SUGESTAO", "PROBLEMA", "DUVIDA"]).default("SUGESTAO"),
});

export type EstadoFeedback = { erro?: string; ok?: boolean };

export async function enviarFeedback(
  _prev: EstadoFeedback,
  formData: FormData,
): Promise<EstadoFeedback> {
  const u = await exigirUsuario();
  const parsed = schema.safeParse({
    texto: formData.get("texto"),
    pagina: formData.get("pagina") || undefined,
    tipo: formData.get("tipo") || "SUGESTAO",
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  await prisma.feedback.create({
    data: {
      texto: parsed.data.texto,
      pagina: parsed.data.pagina || null,
      tipo: parsed.data.tipo,
      autorId: u.id,
      autorNome: u.nome,
      papel: u.papel,
    },
  });
  revalidatePath("/sugestoes");
  return { ok: true };
}

export async function resolverFeedback(formData: FormData) {
  await exigirPapel("ADMIN");
  const id = String(formData.get("id"));
  const resposta = String(formData.get("resposta") ?? "").trim() || null;
  const fb = await prisma.feedback.findUnique({ where: { id } });
  if (!fb) return;
  await prisma.feedback.update({
    where: { id },
    data: { resolvido: !fb.resolvido, resposta },
  });
  revalidatePath("/sugestoes");
}
