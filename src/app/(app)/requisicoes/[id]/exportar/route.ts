import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { numReq } from "@/lib/formato";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await usuarioAtual();
  if (!u) return new Response("Não autenticado", { status: 401 });

  const { id } = await params;
  const req = await prisma.requisicao.findUnique({
    where: { id },
    include: {
      obra: true,
      solicitante: { select: { nome: true } },
      itens: { orderBy: { ordem: "asc" } },
    },
  });
  if (!req) return new Response("Não encontrada", { status: 404 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "App Requisições IRRIGA";
  const ws = wb.addWorksheet(`${numReq(req.numero)}`);

  ws.columns = [
    { width: 26 }, // finalidade
    { width: 60 }, // descrição
    { width: 8 }, // qtde
    { width: 16 }, // dt desejável
    { width: 40 }, // obs
    { width: 8 }, // unid
    { width: 16 }, // código
    { width: 14 }, // prazo
  ];

  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = "SUPRIMENTOS OBRA - Requisição de Compra";
  ws.getCell("A1").font = { bold: true, size: 12 };

  ws.getCell("A3").value = "REQUISIÇÃO:";
  ws.getCell("B3").value = numReq(req.numero);
  ws.getCell("A4").value = "DATA:";
  ws.getCell("B4").value = req.data;
  ws.getCell("B4").numFmt = "dd/mm/yyyy";
  ws.getCell("A5").value = "SOLICITANTE:";
  ws.getCell("B5").value = req.solicitante.nome;
  ws.getCell("A6").value = "OBRA-CIDADE/UF:";
  ws.getCell("B6").value = req.obra.nome;
  for (const r of [3, 4, 5, 6]) ws.getCell(`A${r}`).font = { bold: true };

  const head = [
    "FINALIDADE",
    "DESCRIÇÃO DO MATERIAL/PEÇA",
    "QTDE",
    "Dt DESEJÁVEL entrega",
    "OBSERVAÇÕES GERAIS",
    "UNID",
    "CÓDIGO (IRRIGA ENG)",
    "PRAZO ESTIMADO FORNECIMENTO",
  ];
  const hRow = ws.getRow(7);
  head.forEach((h, i) => {
    const c = hRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.alignment = { wrapText: true, vertical: "middle" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDEBF7" } };
    c.border = { bottom: { style: "thin" } };
  });

  req.itens.forEach((it, i) => {
    const row = ws.getRow(8 + i);
    row.getCell(1).value = it.finalidade;
    row.getCell(2).value = it.descricao;
    row.getCell(3).value = it.quantidade;
    row.getCell(4).value = it.dataDesejavel ?? "";
    if (it.dataDesejavel) row.getCell(4).numFmt = "dd/mm/yyyy";
    row.getCell(5).value = it.observacoes ?? "";
    row.getCell(6).value = it.unidade ?? "";
    row.getCell(7).value = it.codigo ?? "";
    row.getCell(8).value = it.prazoEstimado ?? "";
    row.alignment = { wrapText: true, vertical: "top" };
  });

  const buf = await wb.xlsx.writeBuffer();
  const nome = `Requisicao ${numReq(req.numero)} - ${req.obra.nome}`
    .replace(/[^\w\-. ]+/g, "")
    .slice(0, 80);

  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nome}.xlsx"`,
    },
  });
}
