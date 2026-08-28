-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'SOLICITANTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidadeUf" TEXT,
    "codigo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCatalogo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "natureza" TEXT,
    "unidade" TEXT,
    "prazoEntrega" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pendente" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisicao" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "obraId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "observacaoGeral" TEXT,
    "enviadaEm" TIMESTAMP(3),
    "decididaEm" TIMESTAMP(3),
    "decisorId" TEXT,
    "notaDecisao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "clienteRef" TEXT,

    CONSTRAINT "Requisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisicaoItem" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "itemCatalogoId" TEXT,
    "finalidade" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT,
    "dataDesejavel" TIMESTAMP(3),
    "observacoes" TEXT,
    "codigo" TEXT,
    "prazoEstimado" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "valorUnitario" DOUBLE PRECISION,
    "fornecedor" TEXT,
    "statusItem" TEXT,

    CONSTRAINT "RequisicaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisicaoEvento" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "de" TEXT,
    "para" TEXT,
    "nota" TEXT,
    "autorId" TEXT,
    "autorNome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisicaoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contador" (
    "obraId" TEXT NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("obraId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "pagina" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'SUGESTAO',
    "autorId" TEXT,
    "autorNome" TEXT,
    "papel" TEXT,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "resposta" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Obra_nome_key" ON "Obra"("nome");

-- CreateIndex
CREATE INDEX "ItemCatalogo_descricao_idx" ON "ItemCatalogo"("descricao");

-- CreateIndex
CREATE INDEX "ItemCatalogo_natureza_idx" ON "ItemCatalogo"("natureza");

-- CreateIndex
CREATE UNIQUE INDEX "Requisicao_clienteRef_key" ON "Requisicao"("clienteRef");

-- CreateIndex
CREATE INDEX "Requisicao_status_idx" ON "Requisicao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Requisicao_obraId_numero_key" ON "Requisicao"("obraId", "numero");

-- CreateIndex
CREATE INDEX "RequisicaoItem_requisicaoId_idx" ON "RequisicaoItem"("requisicaoId");

-- CreateIndex
CREATE INDEX "RequisicaoEvento_requisicaoId_idx" ON "RequisicaoEvento"("requisicaoId");

-- CreateIndex
CREATE INDEX "Feedback_resolvido_idx" ON "Feedback"("resolvido");

-- AddForeignKey
ALTER TABLE "ItemCatalogo" ADD CONSTRAINT "ItemCatalogo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisicao" ADD CONSTRAINT "Requisicao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisicao" ADD CONSTRAINT "Requisicao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisicao" ADD CONSTRAINT "Requisicao_decisorId_fkey" FOREIGN KEY ("decisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoItem" ADD CONSTRAINT "RequisicaoItem_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoItem" ADD CONSTRAINT "RequisicaoItem_itemCatalogoId_fkey" FOREIGN KEY ("itemCatalogoId") REFERENCES "ItemCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoEvento" ADD CONSTRAINT "RequisicaoEvento_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "Requisicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoEvento" ADD CONSTRAINT "RequisicaoEvento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

