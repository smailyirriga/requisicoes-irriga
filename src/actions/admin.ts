"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirPapel } from "@/lib/auth";
import { hashSenha } from "@/lib/auth";
import { PAPEIS } from "@/lib/constantes";

const PAPEL_ENUM = z.enum(["SOLICITANTE", "APROVADOR", "SUPRIMENTOS", "ADMIN"]);

/* ---------- Obras ---------- */

const obraSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da obra").max(200),
  cidadeUf: z.string().trim().max(120).optional(),
  codigo: z.string().trim().max(40).optional(),
});

export type EstadoAdmin = { erro?: string; ok?: string };

export async function criarObra(
  _prev: EstadoAdmin,
  formData: FormData,
): Promise<EstadoAdmin> {
  await exigirPapel("ADMIN");
  const parsed = obraSchema.safeParse({
    nome: formData.get("nome"),
    cidadeUf: formData.get("cidadeUf") || undefined,
    codigo: formData.get("codigo") || undefined,
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const existe = await prisma.obra.findUnique({ where: { nome: parsed.data.nome } });
  if (existe) return { erro: "Já existe uma obra com esse nome." };
  await prisma.obra.create({
    data: {
      nome: parsed.data.nome,
      cidadeUf: parsed.data.cidadeUf || null,
      codigo: parsed.data.codigo || null,
    },
  });
  revalidatePath("/obras");
  return { ok: "Obra cadastrada." };
}

export async function alternarAtivoObra(formData: FormData) {
  await exigirPapel("ADMIN");
  const id = String(formData.get("id"));
  const o = await prisma.obra.findUnique({ where: { id } });
  if (!o) return;
  await prisma.obra.update({ where: { id }, data: { ativo: !o.ativo } });
  revalidatePath("/obras");
}

/* ---------- Usuários ---------- */

const userSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  papel: PAPEL_ENUM,
  senha: z.string().min(4, "Senha muito curta").max(100),
});

export async function criarUsuario(
  _prev: EstadoAdmin,
  formData: FormData,
): Promise<EstadoAdmin> {
  await exigirPapel("ADMIN");
  const parsed = userSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    papel: formData.get("papel"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const existe = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existe) return { erro: "Já existe usuário com esse e-mail." };
  await prisma.user.create({
    data: {
      nome: parsed.data.nome,
      email: parsed.data.email,
      papel: parsed.data.papel,
      senhaHash: await hashSenha(parsed.data.senha),
    },
  });
  revalidatePath("/usuarios");
  return { ok: "Usuário criado." };
}

export async function alterarPapel(formData: FormData) {
  await exigirPapel("ADMIN");
  const id = String(formData.get("id"));
  const papel = String(formData.get("papel"));
  if (!PAPEIS.includes(papel as never)) return;
  await prisma.user.update({ where: { id }, data: { papel } });
  revalidatePath("/usuarios");
}

export async function alternarAtivoUsuario(formData: FormData) {
  const admin = await exigirPapel("ADMIN");
  const id = String(formData.get("id"));
  if (id === admin.id) throw new Error("Você não pode desativar a si mesmo.");
  const usr = await prisma.user.findUnique({ where: { id } });
  if (!usr) return;
  await prisma.user.update({ where: { id }, data: { ativo: !usr.ativo } });
  revalidatePath("/usuarios");
}

export async function redefinirSenha(formData: FormData) {
  await exigirPapel("ADMIN");
  const id = String(formData.get("id"));
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 4) throw new Error("Senha muito curta.");
  await prisma.user.update({ where: { id }, data: { senhaHash: await hashSenha(senha) } });
  revalidatePath("/usuarios");
}
