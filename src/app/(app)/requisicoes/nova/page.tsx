import Link from "next/link";
import { NATUREZAS } from "@/lib/constantes";
import { RequisicaoForm } from "@/components/requisicao-form";

// Tela leve (sem consulta ao servidor) para abrir também offline.
// A lista de obras é carregada pelo próprio formulário (API quando online,
// cópia local quando offline).

export default function NovaRequisicaoPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm text-sky-700 hover:underline">
          ← Requisições
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-800">Nova requisição</h1>
      </div>
      <RequisicaoForm obras={[]} naturezas={NATUREZAS} />
    </div>
  );
}
