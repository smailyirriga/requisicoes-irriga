// Tipos compartilhados entre o app online e o modo offline.

export type ItemCatalogoOffline = {
  id: string;
  codigo: string | null;
  descricao: string;
  natureza: string | null;
  unidade: string | null;
  prazoEntrega: string | null;
  pendente: boolean;
};

export type ItemRequisicaoDTO = {
  itemCatalogoId: string | null;
  finalidade: string;
  descricao: string;
  quantidade: number;
  unidade: string | null;
  dataDesejavel: string | null; // yyyy-mm-dd
  observacoes: string | null;
  codigo: string | null;
  prazoEstimado: string | null;
};

export type RascunhoPayload = {
  obraId: string;
  observacaoGeral: string | null;
  itens: ItemRequisicaoDTO[];
};

// Rascunho guardado no celular (IndexedDB)
export type RascunhoLocal = {
  clienteRef: string; // uuid gerado no dispositivo
  payload: RascunhoPayload;
  intencao: "RASCUNHO" | "ENVIAR";
  estado: "LOCAL" | "ENVIANDO" | "ERRO" | "ENVIADO";
  erro?: string | null;
  obraNome?: string;
  criadoEm: number;
  atualizadoEm: number;
  servidorId?: string | null;
  numero?: number | null;
};

export type RequisicaoOfflineItem = {
  id: string;
  finalidade: string;
  descricao: string;
  quantidade: number;
  unidade: string | null;
  dataDesejavel: string | null;
  observacoes: string | null;
  codigo: string | null;
  prazoEstimado: string | null;
  valorUnitario: number | null;
  fornecedor: string | null;
  statusItem: string | null;
};

export type RequisicaoOfflineEvento = {
  tipo: string;
  nota: string | null;
  autorNome: string | null;
  criadoEm: string;
};

export type RequisicaoOffline = {
  id: string;
  clienteRef: string | null;
  numero: number;
  status: string;
  obraNome: string;
  solicitanteNome: string;
  data: string;
  observacaoGeral: string | null;
  notaDecisao: string | null;
  itens: RequisicaoOfflineItem[];
  historico: RequisicaoOfflineEvento[];
};

export type BootstrapResposta = {
  servidorEm: string;
  catalogo: ItemCatalogoOffline[];
  requisicoes: RequisicaoOffline[];
  obras: { id: string; nome: string }[];
};

export type EnvioResposta = {
  clienteRef: string;
  requisicao: RequisicaoOffline;
};
