# Roteiro de validação com os usuários

Objetivo: mostrar o app para a equipe e descobrir se as telas e o fluxo atendem, ou o que
falta, **antes** de publicar na nuvem e investir no modo offline.

## Como dar acesso aos testadores

- Todos precisam estar na **mesma rede Wi‑Fi** do computador que roda o `INICIAR.bat`.
- Passe o endereço `Network: http://192.168.x.x:3000` (aparece na janela preta).
- No celular: abrir o endereço → menu do navegador → **"Adicionar à tela de início"**.
- Se não abrir no celular: liberar o Node.js no Firewall do Windows (aviso aparece na 1ª
  vez) ou rodar o `INICIAR.bat` uma vez como administrador.

> Se a equipe está em obras diferentes / fora da rede, aí sim vale publicar na nuvem antes
> (Supabase + Vercel, grátis) — me avise.

## Logins para a validação (senha `123456`)

| Papel | Login | Testar com |
|---|---|---|
| Solicitante | `smaily@irriga.local` / `marco@irriga.local` | quem abre requisição em obra |
| Aprovador | `aprovador@irriga.local` | quem hoje aprova as compras |
| Suprimentos | `suprimentos@irriga.local` | quem cota e compra |
| Admin | `admin@irriga.local` | você |

## Roteiro por papel

### Solicitante
1. Nova requisição → escolher a obra
2. Buscar um item no catálogo (ex.: "luva vaqueta") e adicionar
3. Adicionar um "item fora do catálogo"
4. Preencher finalidade, quantidade, data desejável, observações
5. Salvar rascunho → reabrir → editar → **Salvar e enviar para aprovação**
6. Conferir a requisição na lista e o histórico

**Perguntar:** falta algum campo? (centro de custo, prioridade, anexar foto/projeto,
número de OS, etc.) A busca do catálogo acha o que você procura? O "fora do catálogo"
resolve?

### Aprovador
1. Abrir uma requisição "Enviada"
2. **Recusar** uma (com motivo) e **Aprovar** outra
3. Ver o histórico e comentar

**Perguntar:** você aprova item a item ou a requisição toda? Precisa ver preço/estimativa
antes de aprovar? Precisa de aviso (e‑mail/WhatsApp) quando chega requisição?

### Suprimentos
1. Abrir uma requisição "Aprovada" → **Iniciar compra**
2. Lançar preço unitário, fornecedor e situação de cada item → **Salvar valores**
3. **Marcar como recebida**
4. **Baixar Excel** e conferir se o formato serve para enviar ao fornecedor

**Perguntar:** o Excel gerado está bom? Falta cotação de vários fornecedores? Ordem de
compra? Controle de entrega parcial?

### Admin
- Cadastrar uma obra nova e um usuário novo
- Catálogo: adicionar item e definir código de um item "sem código"
- **Sugestões**: ler o que a equipe enviou

## Como a equipe registra o que quer

Botão **💬 Sugestão** no canto de qualquer tela → escrever → enviar.
Você vê tudo em **Sugestões** (menu do admin), pode responder e marcar como resolvido.

## O que é fácil x difícil de mudar depois da validação

**Fácil (dias):** adicionar/remover campos, renomear rótulos, mudar naturezas/unidades,
ajustar o Excel, mudar regras de quem vê o quê, telas de lista/filtro, PDF da requisição.

**Médio:** aprovação por alçada/valor, aprovação item a item, notificações por e‑mail,
cotação com vários fornecedores, anexos (fotos/projetos).

**Maior (depende de nuvem):** acesso de qualquer lugar, modo offline no campo, app na
Play Store.

## Depois da validação

Me traga a lista de **Sugestões** (ou um resumo). Eu ajusto o app, aí publicamos na nuvem
e implemento o offline.
