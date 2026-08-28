/**
 * Popula o banco:
 *  - usuários padrão (admin + um de cada papel)
 *  - obras, catálogo (aba BD) e requisições históricas, lendo a planilha em _planilha/
 *
 * Uso:  npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Usa a conexão direta (porta 5432) — melhor para inserção em massa que o pooler 6543.
const prisma = new PrismaClient(
  process.env.DIRECT_URL ? { datasourceUrl: process.env.DIRECT_URL } : {},
);
const RAIZ = process.cwd();
const CADASTRAR = "CADASTRAR";

function acharPlanilha(): string | null {
  const dir = path.join(RAIZ, "_planilha");
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((n) => n.toLowerCase().endsWith(".xlsx"));
  return f ? path.join(dir, f) : null;
}

function txt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "text" in (v as any)) return String((v as any).text).trim();
  if (typeof v === "object" && v !== null && "result" in (v as any)) return String((v as any).result).trim();
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function data(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000));
  return null;
}

// normaliza nome de solicitante -> chave canônica
function canonSolicitante(nome: string): { chave: string; nome: string } {
  const u = nome.trim().toUpperCase();
  if (u.startsWith("SMAILY")) return { chave: "smaily", nome: "Smaily Borém" };
  if (u.startsWith("MARCO")) return { chave: "marco", nome: "Marco Aurélio" };
  if (u.startsWith("GEAN")) return { chave: "gean", nome: "Gean" };
  if (u.startsWith("ADELSON")) return { chave: "adelson", nome: "Adelson" };
  const chave = u.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "desconhecido";
  const nomeFmt = nome.trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { chave, nome: nomeFmt || "Desconhecido" };
}

async function main() {
  // Proteção: não apaga um banco já em uso sem confirmação explícita.
  const jaTem =
    (await prisma.requisicao.count({
      where: { historico: { none: { tipo: "IMPORTADA" } } },
    })) > 0 ||
    (await prisma.feedback.count()) > 0;
  if (jaTem && process.env.FORCE_SEED !== "1") {
    console.error(
      "\n⚠ O banco já tem dados de uso (requisições criadas no app ou feedback).\n" +
        "  Se quer MESMO apagar tudo e reimportar, rode:  FORCE_SEED=1 npm run seed\n",
    );
    process.exit(1);
  }

  console.log("→ Limpando dados...");
  await prisma.feedback.deleteMany();
  await prisma.requisicaoEvento.deleteMany();
  await prisma.requisicaoItem.deleteMany();
  await prisma.requisicao.deleteMany();
  await prisma.contador.deleteMany();
  await prisma.itemCatalogo.deleteMany();
  await prisma.obra.deleteMany();
  await prisma.user.deleteMany();

  const senhaHash = await bcrypt.hash("123456", 10);

  console.log("→ Criando usuários padrão (senha: 123456)...");
  const padrao = [
    { nome: "Administrador", email: "admin@irriga.local", papel: "ADMIN" },
    { nome: "Aprovador", email: "aprovador@irriga.local", papel: "APROVADOR" },
    { nome: "Suprimentos", email: "suprimentos@irriga.local", papel: "SUPRIMENTOS" },
  ];
  for (const p of padrao) {
    await prisma.user.create({ data: { ...p, senhaHash } });
  }

  const planilha = acharPlanilha();
  if (!planilha) {
    console.log("⚠ Nenhuma planilha .xlsx encontrada em _planilha/. Seed básico concluído.");
    // cria uma obra de exemplo
    await prisma.obra.create({ data: { nome: "Obra Exemplo", cidadeUf: "Cidade/UF" } });
    return;
  }

  console.log(`→ Lendo planilha: ${path.basename(planilha)}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(planilha);

  // ---------- Catálogo (aba BD) ----------
  const bd = wb.getWorksheet("BD");
  const catalogoPorCodigo = new Map<string, string>(); // codigo -> itemId
  let nCat = 0,
    nPend = 0;
  if (bd) {
    console.log("→ Importando catálogo (aba BD)...");
    const linhas: {
      codigo: string | null;
      descricao: string;
      natureza: string | null;
      unidade: string | null;
      prazo: string | null;
    }[] = [];
    bd.eachRow((row, i) => {
      if (i < 3) return; // cabeçalho
      const descricao = txt(row.getCell(2).value);
      if (!descricao) return;
      const codRaw = txt(row.getCell(1).value);
      const codigo = codRaw && codRaw.toUpperCase() !== CADASTRAR ? codRaw.replace(/\.0$/, "") : null;
      linhas.push({
        codigo,
        descricao,
        natureza: txt(row.getCell(3).value) || null,
        unidade: txt(row.getCell(4).value) || null,
        prazo: txt(row.getCell(5).value) || null,
      });
    });

    // dedup por código (mantém o primeiro)
    const vistos = new Set<string>();
    const aInserir = linhas.filter((l) => {
      if (l.codigo) {
        if (vistos.has(l.codigo)) return false;
        vistos.add(l.codigo);
        nCat++;
      } else {
        nPend++;
      }
      return true;
    });

    const LOTE = 500;
    for (let i = 0; i < aInserir.length; i += LOTE) {
      const lote = aInserir.slice(i, i + LOTE).map((l) => ({
        codigo: l.codigo,
        descricao: l.descricao,
        natureza: l.natureza,
        unidade: l.unidade,
        prazoEntrega: l.prazo,
        pendente: l.codigo == null,
        ativo: true,
      }));
      await prisma.itemCatalogo.createMany({ data: lote });
      console.log(`  ...${Math.min(i + LOTE, aInserir.length)}/${aInserir.length}`);
    }

    const comCodigo = await prisma.itemCatalogo.findMany({
      where: { codigo: { not: null } },
      select: { id: true, codigo: true },
    });
    for (const it of comCodigo) if (it.codigo) catalogoPorCodigo.set(it.codigo, it.id);
    console.log(`  ${nCat} itens com código + ${nPend} itens a cadastrar`);
  }

  // ---------- Requisições ----------
  const abasReq = wb.worksheets.filter((ws) => /^#/.test(ws.name.trim()));
  console.log(`→ Importando ${abasReq.length} requisições...`);

  const usuariosCache = new Map<string, string>(); // chave -> userId
  const obrasCache = new Map<string, string>(); // nomeObra -> obraId
  const contadores = new Map<string, number>();

  for (const ws of abasReq) {
    const dataReq = data(ws.getCell("B4").value) ?? new Date();
    const solicitanteRaw = txt(ws.getCell("B5").value) || "Desconhecido";
    const obraNome = txt(ws.getCell("B6").value) || "Obra não informada";

    // usuário solicitante
    const { chave, nome } = canonSolicitante(solicitanteRaw);
    let userId = usuariosCache.get(chave);
    if (!userId) {
      const email = `${chave}@irriga.local`;
      const u =
        (await prisma.user.findUnique({ where: { email } })) ??
        (await prisma.user.create({ data: { nome, email, senhaHash, papel: "SOLICITANTE" } }));
      userId = u.id;
      usuariosCache.set(chave, userId);
    }

    // obra
    let obraId = obrasCache.get(obraNome);
    if (!obraId) {
      const partes = obraNome.split(" - ");
      const cidadeUf = partes.length > 1 ? partes[partes.length - 1].trim() : null;
      const o =
        (await prisma.obra.findUnique({ where: { nome: obraNome } })) ??
        (await prisma.obra.create({ data: { nome: obraNome, cidadeUf } }));
      obraId = o.id;
      obrasCache.set(obraNome, obraId);
    }

    const proximo = (contadores.get(obraId) ?? 0) + 1;
    contadores.set(obraId, proximo);

    // itens
    const itensData: any[] = [];
    let ordem = 0;
    ws.eachRow((row, i) => {
      if (i < 8) return;
      const descricao = txt(row.getCell(2).value);
      const finalidade = txt(row.getCell(1).value);
      if (!descricao && !finalidade) return;
      if (!descricao) return;
      const codRaw = txt(row.getCell(7).value);
      const codigo =
        codRaw && codRaw.toUpperCase() !== CADASTRAR ? codRaw.replace(/\.0$/, "") : CADASTRAR;
      const itemCatalogoId = codigo !== CADASTRAR ? catalogoPorCodigo.get(codigo) ?? null : null;
      itensData.push({
        finalidade: finalidade || "—",
        descricao,
        quantidade: num(row.getCell(3).value) ?? 0,
        dataDesejavel: data(row.getCell(4).value),
        observacoes: txt(row.getCell(5).value) || null,
        unidade: txt(row.getCell(6).value) || null,
        codigo,
        prazoEstimado: txt(row.getCell(8).value) || null,
        itemCatalogoId,
        ordem: ordem++,
      });
    });

    if (itensData.length === 0) continue;

    await prisma.requisicao.create({
      data: {
        numero: proximo,
        obraId,
        solicitanteId: userId,
        data: dataReq,
        status: "RECEBIDA",
        observacaoGeral: `Importada da planilha (aba "${ws.name.trim()}").`,
        enviadaEm: dataReq,
        decididaEm: dataReq,
        criadoEm: dataReq,
        itens: { create: itensData },
        historico: {
          create: {
            tipo: "IMPORTADA",
            nota: `Importada da planilha original — aba "${ws.name.trim()}". Status "Recebida" atribuído automaticamente.`,
            autorNome: "Importação",
            criadoEm: dataReq,
          },
        },
      },
    });
    await prisma.contador.upsert({
      where: { obraId },
      create: { obraId, ultimo: proximo },
      update: { ultimo: proximo },
    });
  }

  const totalReq = await prisma.requisicao.count();
  const totalItens = await prisma.itemCatalogo.count();
  const totalObras = await prisma.obra.count();
  const totalUsers = await prisma.user.count();
  console.log(
    `✔ Concluído: ${totalUsers} usuários, ${totalObras} obras, ${totalItens} itens de catálogo, ${totalReq} requisições.`,
  );
  console.log("\nLogins (senha 123456):");
  console.log("  admin@irriga.local        (Administrador)");
  console.log("  aprovador@irriga.local    (Aprovador)");
  console.log("  suprimentos@irriga.local  (Suprimentos)");
  for (const [chave] of usuariosCache) console.log(`  ${chave}@irriga.local`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
