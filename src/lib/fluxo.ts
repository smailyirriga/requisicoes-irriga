import type { Papel, Status } from "./constantes";
import type { UsuarioSessao } from "./auth";

type Req = {
  status: string;
  solicitanteId: string;
};

export function ehDono(u: UsuarioSessao, r: Req) {
  return u.id === r.solicitanteId;
}

export function podeEditar(u: UsuarioSessao, r: Req) {
  if (u.papel === "ADMIN") return true;
  return r.status === "RASCUNHO" && ehDono(u, r);
}

/** Ações de mudança de status disponíveis para o usuário na requisição atual. */
export function acoesDisponiveis(u: UsuarioSessao, r: Req): Acao[] {
  const admin = u.papel === "ADMIN";
  const acoes: Acao[] = [];

  if (r.status === "RASCUNHO" && (ehDono(u, r) || admin)) {
    acoes.push("ENVIAR");
    acoes.push("CANCELAR");
  }
  if (r.status === "ENVIADA") {
    if (u.papel === "APROVADOR" || admin) {
      acoes.push("APROVAR");
      acoes.push("RECUSAR");
    }
    if (ehDono(u, r) || admin) acoes.push("CANCELAR");
  }
  if (r.status === "APROVADA" && (u.papel === "SUPRIMENTOS" || admin)) {
    acoes.push("INICIAR_COMPRA");
  }
  if (r.status === "EM_COMPRA" && (u.papel === "SUPRIMENTOS" || admin)) {
    acoes.push("MARCAR_RECEBIDA");
  }
  if (r.status === "RECUSADA" && (ehDono(u, r) || admin)) {
    acoes.push("REABRIR"); // volta para rascunho
  }
  if (admin && r.status !== "CANCELADA") {
    acoes.push("CANCELAR_ADMIN");
  }
  return acoes;
}

export type Acao =
  | "ENVIAR"
  | "APROVAR"
  | "RECUSAR"
  | "INICIAR_COMPRA"
  | "MARCAR_RECEBIDA"
  | "REABRIR"
  | "CANCELAR"
  | "CANCELAR_ADMIN";

export const ACAO_LABEL: Record<Acao, string> = {
  ENVIAR: "Enviar para aprovação",
  APROVAR: "Aprovar",
  RECUSAR: "Recusar",
  INICIAR_COMPRA: "Iniciar compra",
  MARCAR_RECEBIDA: "Marcar como recebida",
  REABRIR: "Reabrir (voltar a rascunho)",
  CANCELAR: "Cancelar",
  CANCELAR_ADMIN: "Cancelar (admin)",
};

export const ACAO_STATUS: Record<Acao, Status> = {
  ENVIAR: "ENVIADA",
  APROVAR: "APROVADA",
  RECUSAR: "RECUSADA",
  INICIAR_COMPRA: "EM_COMPRA",
  MARCAR_RECEBIDA: "RECEBIDA",
  REABRIR: "RASCUNHO",
  CANCELAR: "CANCELADA",
  CANCELAR_ADMIN: "CANCELADA",
};

export const ACAO_EVENTO: Record<Acao, string> = {
  ENVIAR: "ENVIADA",
  APROVAR: "APROVADA",
  RECUSAR: "RECUSADA",
  INICIAR_COMPRA: "EM_COMPRA",
  MARCAR_RECEBIDA: "RECEBIDA",
  REABRIR: "REABERTA",
  CANCELAR: "CANCELADA",
  CANCELAR_ADMIN: "CANCELADA",
};

export function podeVerValores(papel: Papel) {
  return papel === "SUPRIMENTOS" || papel === "ADMIN" || papel === "APROVADOR";
}

export function podeEditarValores(papel: Papel) {
  return papel === "SUPRIMENTOS" || papel === "ADMIN";
}
