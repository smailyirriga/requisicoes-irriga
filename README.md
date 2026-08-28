# App de Requisições de Compra — IRRIGA ENGENHARIA

Aplicativo web (e celular, como PWA) para substituir a planilha Excel de requisições de
compra. Vários usuários, múltiplas obras, catálogo de itens (aba BD), fluxo de aprovação
e **funcionamento offline** na obra.

- **Stack:** Next.js + PostgreSQL (Supabase) + hospedagem Vercel. Tudo em plano gratuito.
- **Colocar no ar:** siga o **[DEPLOY.md](DEPLOY.md)** (GitHub → Supabase → Vercel).

---

## Rodar no computador (desenvolvimento)

1. Instale o **Node.js LTS**: https://nodejs.org
2. `INSTALAR.bat` (instala dependências).
3. Configure o `.env` com o banco Supabase — passos 2 e 3 do [DEPLOY.md](DEPLOY.md).
4. `INICIAR.bat` → abre em http://localhost:3000

## Logins iniciais (senha `123456`)

| E-mail | Papel |
|---|---|
| `admin@irriga.local` | Administrador — tudo, cadastra obras e usuários |
| `aprovador@irriga.local` | Aprovador — aprova / recusa |
| `suprimentos@irriga.local` | Suprimentos — compra, valores, recebimento |
| `smaily@` `marco@` `gean@` `adelson@` `irriga.local` | Solicitante |

Cada pessoa troca a própria senha no menu do nome → **Minha conta**. O admin cria os
usuários reais em **Usuários**.

---

## Fluxo da requisição

```
Rascunho ─(enviar)→ Enviada ─(aprovador)→ Aprovada ─(suprimentos)→ Em compra ─→ Recebida
                        └─(aprovador)→ Recusada ─(solicitante)→ volta a Rascunho
```

- **Solicitante**: escolhe a obra, adiciona itens (busca no catálogo ou "fora do
  catálogo"), preenche finalidade / quantidade / data / observações, salva ou envia.
- **Aprovador**: aprova ou recusa (recusa exige motivo).
- **Suprimentos**: lança preço, fornecedor e situação por item; marca recebida. O
  solicitante **não vê preços**.
- Todos comentam; tudo fica no histórico.
- **Baixar Excel** gera a requisição no formato da planilha antiga.
- **💬 Sugestão** (canto da tela) → o admin lê em **Sugestões**. Ver [VALIDACAO.md](VALIDACAO.md).

## Offline (obra sem sinal)

- O app instalado no celular abre sem internet.
- **Catálogo** fica baixado no aparelho — busca funciona offline.
- **Nova requisição** offline: fica salva no aparelho ("Rascunhos") e é **enviada sozinha**
  quando o sinal volta.
- Dá para **consultar** as requisições recentes já baixadas, offline.
- Aprovação e compra continuam **online** (escritório tem sinal).
- Barra no topo mostra o status (online/offline, pendências, última sincronização).
- Detalhe técnico: `src/lib/offline/` (IndexedDB) + `src/app/sw.ts` (service worker, Serwist).

## Catálogo (aba BD)

- ~4.270 itens com código + itens "a cadastrar", importados da planilha.
- Suprimentos/Admin adicionam itens e **definem o código** dos que entraram sem código.
- Item fora do catálogo entra com código `CADASTRAR`.

## Importação da planilha

- Requisições **renumeradas por obra** (#001, #002…) na ordem das abas; o nome da aba
  original fica nas "observações gerais" e no histórico.
- As 26 requisições antigas entraram como **Recebida** (histórico).
- Reimportar do zero: `FORCE_SEED=1 npm run seed` (apaga e recria — cuidado).

---

## Comandos

| Comando | O quê |
|---|---|
| `npm run dev` | inicia o app (o `INICIAR.bat` faz isso) |
| `npm run seed` | carrega catálogo + requisições da planilha no banco |
| `npm run db:studio` | abre o Prisma Studio (ver/editar o banco) |
| `npx prisma migrate deploy` | aplica as migrações no banco |
| `npm run build` / `npm start` | versão de produção |

## Estrutura

```
_planilha/            planilha original (fonte da importação)
prisma/schema.prisma  modelo do banco (PostgreSQL)
prisma/migrations/    migrações
scripts/seed.ts       importação da planilha
src/app/              telas (Next.js App Router) + sw.ts (service worker)
src/actions/          ações de servidor (login, requisições, catálogo, admin, conta, feedback)
src/lib/              auth, permissões, fluxo, formatação, requisicoes-core
src/lib/offline/      camada offline (IndexedDB, sincronização)
src/components/       componentes de UI
```
