# Colocar o app na nuvem (Supabase + Vercel)

Tudo em plano **gratuito**, sem cartão. São 3 contas: **GitHub**, **Supabase**, **Vercel**.
Faça na ordem. Tempo: ~30–40 min na primeira vez.

---

## 1. GitHub (guardar o código)

1. Crie conta em https://github.com (se ainda não tem).
2. Crie um repositório **privado** chamado `requisicoes-irriga` — **sem** README, sem .gitignore.
3. No computador, dentro da pasta do projeto, rode (troque `SEU-USUARIO`):

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/requisicoes-irriga.git
   git branch -M main
   git push -u origin main
   ```

   > O projeto já vem com o Git iniciado e o primeiro commit feito.
   > O GitHub vai pedir login (use um **Personal Access Token** como senha:
   > GitHub → Settings → Developer settings → Tokens → Generate, escopo `repo`).

---

## 2. Supabase (banco de dados)

1. Crie conta em https://supabase.com (entre com o GitHub).
2. **New project**:
   - Name: `requisicoes-irriga`
   - Database Password: **gere uma forte e guarde** (vai usar já já)
   - Region: **South America (São Paulo)**
3. Espere ~2 min o projeto subir.
4. Menu **Connect** (botão no topo) → aba **ORMs** / ou **Project Settings → Database → Connection string**:
   - **Transaction pooler** (porta **6543**) → esse é o `DATABASE_URL`
   - **Session pooler** (porta **5432**) → esse é o `DIRECT_URL`
   - Em ambos, troque `[YOUR-PASSWORD]` pela senha do passo 2.
   - No `DATABASE_URL`, deixe no final: `?pgbouncer=true&connection_limit=1`

---

## 3. Preparar o banco (uma vez, do seu PC)

1. Na pasta do projeto, edite o arquivo **`.env`**:

   ```
   DATABASE_URL="postgresql://postgres.xxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.xxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
   AUTH_SECRET="<cole aqui um valor aleatório>"
   ```

   Gere o `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

2. Crie as tabelas e carregue os dados:

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

3. Teste local apontando pra nuvem:

   ```bash
   npm run dev
   ```
   Abra http://localhost:3000 e entre com `admin@irriga.local` / `123456`.

---

## 4. Vercel (hospedar o app)

1. Crie conta em https://vercel.com (entre com o GitHub).
2. **Add New → Project** → importe o repositório `requisicoes-irriga`.
3. Em **Environment Variables**, adicione as 3 (mesmos valores do `.env`):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
4. **Deploy**. Em ~2 min o app está no ar em algo como
   `https://requisicoes-irriga.vercel.app`.

> O `build` já roda as migrações automaticamente (`prisma migrate deploy`).

---

## 5. Pós-publicação

- Entre como `admin@irriga.local` e **troque a senha** (menu do seu nome → Minha conta).
- **Usuários**: crie cada pessoa da equipe com uma senha inicial. Cada um troca depois.
- **Obras**: cadastre as outras obras da IRRIGA.
- Mande o link para a equipe. No celular: abrir o link → menu do navegador →
  **"Adicionar à tela de início"**. Vira um ícone de app e passa a funcionar offline.
- Apague os logins de teste que não forem usar (`aprovador@`, `suprimentos@`, `gean@`...),
  ou pelo menos troque as senhas.

---

## Atualizar o app depois

Toda vez que houver melhoria no código:

```bash
git add -A && git commit -m "descrição da mudança" && git push
```

A Vercel publica sozinha em ~2 min. As migrações de banco rodam no deploy.

---

## Dados / manutenção

- **Ver/editar o banco**: `npm run db:studio` (com o `.env` apontando pra nuvem).
- **Reimportar a planilha** (cuidado, apaga tudo): `FORCE_SEED=1 npm run seed`.
- Supabase free: 500 MB de banco, pausa após 1 semana sem uso (basta abrir pra reativar).
  Se crescer, o upgrade é US$25/mês — mas para esse volume, o free dura bastante.
