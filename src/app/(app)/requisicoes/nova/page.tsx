import Link from "next/link";
import { prisma } from "@/lib/db";
import { NATUREZAS } from "@/lib/constantes";
import { RequisicaoForm } from "@/components/requisicao-form";

export const dynamic = "force-dynamic";

export default async function NovaRequisicaoPage() {
  const obras = await prisma.obra.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm text-sky-700 hover:underline">
          ← Requisições
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">Nova requisição</h1>
      </div>

      {obras.length === 0 ? (
        <p className="card p-4 text-sm text-slate-600">
          Nenhuma obra cadastrada. Peça a um administrador para cadastrar uma obra em{" "}
          <Link href="/obras" className="text-sky-700 underline">
            Obras
          </Link>
          .
        </p>
      ) : (
        <RequisicaoForm obras={obras} naturezas={NATUREZAS} />
      )}
    </div>
  );
}
