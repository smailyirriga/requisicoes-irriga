/**
 * Importa (SEM apagar nada) o histórico de requisições de uma ou mais planilhas.
 * - Novos itens de catálogo (aba BD) são adicionados; os existentes ficam como estão.
 * - Cada aba "#..." vira uma requisição histórica (status Recebida).
 * - Rodar de novo é seguro: abas já importadas são puladas.
 *
 * Uso:
 *   npm run importar                      -> importa todos os .xlsx de _planilha/
 *   npm run importar -- "C:/caminho/x.xlsx"   -> importa um arquivo específico
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
  process.env.DIRECT_URL ? { datasourceUrl: process.env.DIRECT_URL } : {},
);
const RAIZ = process.cwd();
const CADASTRAR = "CADASTRAR";

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
function canonSolicitante(nome: string): { chave: string; nome: string } {
  const u = nome.trim().toUpperCase();
  if (u.startsWith("SMAILY")) return { chave: "smaily", nome: "Smaily Borém" };
  if (u.startsWith("MARCO")) return { chave: "marco", nome: "Marco Aurélio" };
  if (u.startsWith("GEAN")) return { chave: "gean", nome: "Gean" };
  if (u.startsWith("ADELSON")) return { chave: "adelson", nome: "Adelson" };
  const chave = slug(u) || "desconhecido";
  const nomeFmt = nome.trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { chave, nome: nomeFmt || "Desconhecido" };
}

function arquivos(): string[] {
  const arg = process.argv[2];
  if (arg) return [path.resolve(arg)];
  const dir = path.join(RAIZ, "_planilha");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.toLowerCase().endsWith(".xlsx") && !n.startsWith("~$"))
    .map((n) => path.join(dir, n));
}

async function main() {
  const files = arquivos();
  if (files.length === 0) {
    console.error("Nenhuma planilha .xlsx encontrada em _planilha/.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash("123456", 10);
  const usuariosCache = new Map<string, string>();
  const obrasCache = new Map<string, string>();

  // mapa código -> id (catálogo atual)
  const catalogo = new Map<string, string>();
  for (const it of await prisma.itemCatalogo.findMany({
    where: { codigo: { not: null } },
    select: { id: true, codigo: true },
  })) {
    if (it.codigo) catalogo.set(it.codigo, it.id);
  }

  let totalNovasReq = 0;
  let totalPuladas = 0;
  let totalItensCat = 0;

  for (const file of files) {
    const nomeArq = path.basename(file);
    console.log(`\n=== ${nomeArq} ===`);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);

    // ---- catálogo (aba BD), aditivo ----
    const bd = wb.getWorksheet("BD");
    if (bd) {
      const novos: any[] = [];
      const vistos = new Set<string>();
      bd.eachRow((row, i) => {
        if (i < 3) return;
        const descricao = txt(row.getCell(2).value);
        if (!descricao) return;
        const codRaw = txt(row.getCell(1).value);
        const codigo =
          codRaw && codRaw.toUpperCase() !== CADASTRAR ? codRaw.replace(/\.0$/, "") : null;
        if (codigo) {
          if (catalogo.has(codigo) || vistos.has(codigo)) return;
          vistos.add(codigo);
        }
        novos.push({
          codigo,
          descricao,
          natureza: txt(row.getCell(3).value) || null,
          unidade: txt(row.getCell(4).value) || null,
          prazoEntrega: txt(row.getCell(5).value) || null,
          pendente: codigo == null,
          ativo: true,
        });
      });
      // só adiciona itens com código novo (evita encher de "pendentes" repetidos)
      const comCodigo = novos.filter((n) => n.codigo);
      for (let k = 0; k < comCodigo.length; k += 500) {
        await prisma.itemCatalogo.createMany({ data: comCodigo.slice(k, k + 500) });
      }
      for (const it of await prisma.itemCatalogo.findMany({
        where: { codigo: { in: comCodigo.map((c) => c.codigo) } },
        select: { id: true, codigo: true },
      })) {
        if (it.codigo) catalogo.set(it.codigo, it.id);
      }
      totalItensCat += comCodigo.length;
      if (comCodigo.length) console.log(`  +${comCodigo.length} itens de catálogo`);
    }

    // ---- requisições ----
    const abasReq = wb.worksheets.filter((ws) => /^#/.test(ws.name.trim()));
    for (const ws of abasReq) {
      const nomeAba = ws.name.trim();
      const dataReq = data(ws.getCell("B4").value) ?? new Date();
      const solicitanteRaw = txt(ws.getCell("B5").value) || "Desconhecido";
      const obraNome = txt(ws.getCell("B6").value) || `Obra (${nomeArq})`;

      // dedupe: já existe requisição dessa aba?
      const clienteRef = `imp:${slug(nomeArq)}:${slug(nomeAba)}`;
      const jaImportada =
        (await prisma.requisicao.findUnique({ where: { clienteRef } })) ??
        (await prisma.requisicao.findFirst({
          where: {
            obra: { nome: obraNome },
            observacaoGeral: { contains: `aba "${nomeAba}"` },
          },
        }));
      if (jaImportada) {
        totalPuladas++;
        continue;
      }

      // usuário
      const { chave, nome } = canonSolicitante(solicitanteRaw);
      let userId = usuariosCache.get(chave);
      if (!userId) {
        const email = `${chave}@irriga.local`;
        const u =
          (await prisma.user.findUnique({ where: { email } })) ??
          (await prisma.user.create({
            data: { nome, email, senhaHash, papel: "SOLICITANTE" },
          }));
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

      // itens
      const itensData: any[] = [];
      let ordem = 0;
      ws.eachRow((row, i) => {
        if (i < 8) return;
        const descricao = txt(row.getCell(2).value);
        if (!descricao) return;
        const codRaw = txt(row.getCell(7).value);
        const codigo =
          codRaw && codRaw.toUpperCase() !== CADASTRAR ? codRaw.replace(/\.0$/, "") : CADASTRAR;
        itensData.push({
          finalidade: txt(row.getCell(1).value) || "—",
          descricao,
          quantidade: num(row.getCell(3).value) ?? 0,
          dataDesejavel: data(row.getCell(4).value),
          observacoes: txt(row.getCell(5).value) || null,
          unidade: txt(row.getCell(6).value) || null,
          codigo,
          prazoEstimado: txt(row.getCell(8).value) || null,
          itemCatalogoId: codigo !== CADASTRAR ? catalogo.get(codigo) ?? null : null,
          ordem: ordem++,
        });
      });
      if (itensData.length === 0) continue;

      // próximo número da obra
      const c = await prisma.contador.upsert({
        where: { obraId },
        create: { obraId, ultimo: 1 },
        update: { ultimo: { increment: 1 } },
      });
      const numero = c.ultimo;

      await prisma.requisicao.create({
        data: {
          numero,
          obraId,
          solicitanteId: userId,
          data: dataReq,
          status: "RECEBIDA",
          clienteRef,
          observacaoGeral: `Importada da planilha "${nomeArq}" (aba "${nomeAba}").`,
          enviadaEm: dataReq,
          decididaEm: dataReq,
          criadoEm: dataReq,
          itens: { create: itensData },
          historico: {
            create: {
              tipo: "IMPORTADA",
              nota: `Importada de "${nomeArq}" — aba "${nomeAba}". Status "Recebida" atribuído automaticamente.`,
              autorNome: "Importação",
              criadoEm: dataReq,
            },
          },
        },
      });
      totalNovasReq++;
    }
  }

  console.log(
    `\n✔ ${totalNovasReq} requisições novas importadas, ${totalPuladas} já existiam, +${totalItensCat} itens de catálogo.`,
  );
  const obras = await prisma.obra.findMany({
    select: { nome: true, _count: { select: { requisicoes: true } } },
    orderBy: { nome: "asc" },
  });
  console.log("\nObras:");
  for (const o of obras) console.log(`  ${o._count.requisicoes.toString().padStart(3)}  ${o.nome}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
