"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirPapel } from "@/lib/auth";

const schema = z.object({
  codigo: z.string().trim().max(40).optional(),
  descricao: z.string().trim().min(3, "Descrição muito curta").max(1000),
  natureza: z.string().trim().max(80).optional(),
  unidade: z.string().trim().max(20).optional(),
  prazoEntrega: z.string().trim().max(40).optional(),
});

export type EstadoCatalogo = { erro?: string; ok?: string };

export async function criarItemCatalogo(
  _prev: EstadoCatalogo,
  formData: FormData,
): Promise<EstadoCatalogo> {
  await exigirPapel("SUPRIMENTOS", "ADMIN");
  const parsed = schema.safeParse({
    codigo: formData.get("codigo") || undefined,
    descricao: formData.get("descricao"),
    natureza: formData.get("natureza") || undefined,
    unidade: formData.get("unidade") || undefined,
    prazoEntrega: formData.get("prazoEntrega") || undefined,
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const codigo = parsed.data.codigo?.trim() || null;
  if (codigo) {
    const existe = await prisma.itemCatalogo.findFirst({ where: { codigo } });
    if (existe) return { erro: `Já existe item com o código ${codigo}.` };
  }

  await prisma.itemCatalogo.create({
    data: {
      codigo,
      descricao: parsed.data.descricao,
      natureza: parsed.data.natureza || null,
      unidade: parsed.data.unidade || null,
      prazoEntrega: parsed.data.prazoEntrega || null,
      pendente: !codigo,
    },
  });
  revalidatePath("/catalogo");
  return { ok: "Item adicionado ao catálogo." };
}

export async function definirCodigoItem(formData: FormData) {
  await exigirPapel("SUPRIMENTOS", "ADMIN");
  const id = String(formData.get("id"));
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!codigo) return;
  const existe = await prisma.itemCatalogo.findFirst({ where: { codigo, NOT: { id } } });
  if (existe) throw new Error(`Código ${codigo} já usado por outro item.`);
  await prisma.itemCatalogo.update({
    where: { id },
    data: { codigo, pendente: false },
  });
  revalidatePath("/catalogo");
}

export async function alternarAtivoItem(formData: FormData) {
  await exigirPapel("SUPRIMENTOS", "ADMIN");
  const id = String(formData.get("id"));
  const item = await prisma.itemCatalogo.findUnique({ where: { id } });
  if (!item) return;
  await prisma.itemCatalogo.update({ where: { id }, data: { ativo: !item.ativo } });
  revalidatePath("/catalogo");
}
