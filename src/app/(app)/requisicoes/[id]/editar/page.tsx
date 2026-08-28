import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { podeEditar } from "@/lib/fluxo";
import { NATUREZAS } from "@/lib/constantes";
import { RequisicaoForm, type ItemForm } from "@/components/requisicao-form";

export const dynamic = "force-dynamic";

export default async function EditarRequisicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = (await usuarioAtual())!;

  const req = await prisma.requisicao.findUnique({
    where: { id },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
  if (!req) notFound();
  if (!podeEditar(u, req)) redirect(`/requisicoes/${id}`);

  const obras = await prisma.obra.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  const itens: ItemForm[] = req.itens.map((it) => ({
    key: it.id,
    itemCatalogoId: it.itemCatalogoId,
    finalidade: it.finalidade,
    descricao: it.descricao,
    quantidade: String(it.quantidade),
    unidade: it.unidade ?? "",
    dataDesejavel: it.dataDesejavel
      ? new Date(it.dataDesejavel).toISOString().slice(0, 10)
      : "",
    observacoes: it.observacoes ?? "",
    codigo: it.codigo ?? "",
    prazoEstimado: it.prazoEstimado ?? "",
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/requisicoes/${id}`} className="text-sm text-sky-700 hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">
          Editar requisição #{String(req.numero).padStart(3, "0")}
        </h1>
      </div>
      <RequisicaoForm
        obras={obras}
        naturezas={NATUREZAS}
        inicial={{
          id: req.id,
          obraId: req.obraId,
          observacaoGeral: req.observacaoGeral ?? "",
          itens,
        }}
      />
    </div>
  );
}
