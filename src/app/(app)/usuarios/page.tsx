import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { FormNovoUsuario } from "@/components/forms-admin";
import { alterarPapel, alternarAtivoUsuario, redefinirSenha } from "@/actions/admin";
import { PAPEIS, PAPEL_LABEL } from "@/lib/constantes";
import { dataBR } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const u = (await usuarioAtual())!;
  if (u.papel !== "ADMIN") redirect("/");

  const usuarios = await prisma.user.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { requisicoes: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Usuários</h1>
      <FormNovoUsuario />

      <div className="card divide-y divide-slate-100">
        {usuarios.map((usr) => (
          <div key={usr.id} className={`space-y-2 p-3 ${!usr.ativo ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {usr.nome}{" "}
                  {usr.id === u.id && <span className="text-xs text-slate-400">(você)</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {usr.email} · desde {dataBR(usr.criadoEm)} · {usr._count.requisicoes} req.
                  {!usr.ativo ? " · inativo" : ""}
                </p>
              </div>

              <form action={alterarPapel} className="flex items-center gap-1">
                <input type="hidden" name="id" value={usr.id} />
                <select
                  name="papel"
                  defaultValue={usr.papel}
                  className="campo w-auto py-1 text-xs"
                >
                  {PAPEIS.map((p) => (
                    <option key={p} value={p}>
                      {PAPEL_LABEL[p]}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary py-1 text-xs">Aplicar</button>
              </form>

              {usr.id !== u.id && (
                <form action={alternarAtivoUsuario}>
                  <input type="hidden" name="id" value={usr.id} />
                  <button className="text-xs text-slate-400 hover:underline">
                    {usr.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
              )}
            </div>

            <form action={redefinirSenha} className="flex items-center gap-2">
              <input type="hidden" name="id" value={usr.id} />
              <input
                name="senha"
                placeholder="nova senha"
                className="campo max-w-[12rem] py-1 text-xs"
                required
              />
              <button className="btn-secondary py-1 text-xs">Redefinir senha</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
