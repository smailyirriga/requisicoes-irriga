export const PAPEIS = ["SOLICITANTE", "APROVADOR", "SUPRIMENTOS", "ADMIN"] as const;
export type Papel = (typeof PAPEIS)[number];

export const PAPEL_LABEL: Record<Papel, string> = {
  SOLICITANTE: "Solicitante",
  APROVADOR: "Aprovador",
  SUPRIMENTOS: "Suprimentos",
  ADMIN: "Administrador",
};

export const STATUS = [
  "RASCUNHO",
  "ENVIADA",
  "APROVADA",
  "RECUSADA",
  "EM_COMPRA",
  "RECEBIDA",
  "CANCELADA",
] as const;
export type Status = (typeof STATUS)[number];

export const STATUS_LABEL: Record<Status, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EM_COMPRA: "Em compra",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
};

export const STATUS_COR: Record<Status, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700 ring-slate-200",
  ENVIADA: "bg-amber-100 text-amber-800 ring-amber-200",
  APROVADA: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  RECUSADA: "bg-rose-100 text-rose-800 ring-rose-200",
  EM_COMPRA: "bg-sky-100 text-sky-800 ring-sky-200",
  RECEBIDA: "bg-violet-100 text-violet-800 ring-violet-200",
  CANCELADA: "bg-slate-100 text-slate-500 ring-slate-200",
};

// Unidades vistas na planilha (as mais comuns primeiro)
export const UNIDADES = [
  "PÇ", "M", "M²", "M³", "KG", "TON", "LT", "GL", "UNID", "BR", "CJ", "JG",
  "PCT", "CX", "RL", "PAR", "KIT", "BD", "BL", "SC", "TB", "CT", "MM", "CM",
  "VB", "SERV", "HR", "DIARIA", "SEMANAL", "QUINZENAL", "MENSAL", "AMOSTRA",
];

// Naturezas (categorias) do BD — lista curada
export const NATUREZAS = [
  "MANUTENÇÃO",
  "MATERIAIS OBRAS CIVIS",
  "PEÇAS PARA REVENDA",
  "BANHEIRO/GERADOR/FERRAMENTAS",
  "DIVERSOS/CREA/EPI",
  "PAPELARIA",
  "TAMPAS/SUPORTES/ESCADAS",
  "KIT ESTOJOS / JUNTAS EPDM",
  "ALAMBRADO",
  "ADUELAS/MANILHAS",
  "EMPREITADA",
  "RESERVATÓRIOS/PEAD/ABRAÇADEIRAS",
  "DESPESAS MARKETING",
  "IMOBILIZADO OBRAS",
  "ESCRITÓRIO ADM",
  "HOSPEDAGEM OBRA",
  "PONTALETES",
  "LOCAÇÃO DE MÁQUINAS/CAMINHÕES",
  "CONCRETO",
  "CALDEIRARIA",
  "COMBUSTÍVEL OBRA",
  "FRETE OBRA",
  "ALIMENTAÇÃO OBRA",
  "TOPOGRAFIA",
  "MOBILIZAÇÃO OBRA",
];

export const CODIGO_A_CADASTRAR = "CADASTRAR";
