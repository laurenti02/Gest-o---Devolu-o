# Sistema Grupo Nautika — Devolução, Refaturamento e Planner

App único (Next.js) reunindo três áreas que antes eram separadas:

- **Solicitação de Devolução** — formulário público, aprovações (Diretoria/Gerente/ADM),
  conferência por setor (Validação NFD, Transportes, Recebimento, Financeiro), com SLA e histórico.
- **Refaturamento** — mesmo banco, fluxo próprio: ADM aprova → Logística → Fiscal → Financeiro.
- **Planner Administrativo Comercial** — login próprio por gestor (conta separada dos perfis acima),
  cada um com seu espaço: metas, agenda, funil de vendas, carteira de clientes, tarefas, financeiro.

Tudo roda num banco **Postgres** só, e o app publica tudo junto no **Vercel**.

## O que tem aqui
- `app/` — páginas e rotas de API do Next.js (App Router)
  - `app/login`, `app/aprovacoes`, `app/setor`, `app/relatorio`, `app/admin` — Devolução
  - `app/refaturamento/*` — Refaturamento
  - `app/planner` — serve o Planner (HTML próprio em `public/planner-app.html`, com API em `app/api/planner/*`)
  - `app/api/*` — rotas de API de cada área
- `lib/db/schema.ts` — estrutura das tabelas (Drizzle ORM, Postgres)
- `lib/db/index.ts` — conexão com o banco (lê `DATABASE_URL`)
- `lib/db/init-pg.sql` — cria as tabelas automaticamente se não existirem
- `lib/db/seed.ts` — cria as tabelas (via `init-pg.sql`) e os usuários padrão da Devolução/Refaturamento
- `lib/perfis.ts`, `lib/fluxo.ts`, `lib/refaturamento-fluxo.ts` — regras de cada perfil/fluxo
- `public/planner-app.html` — a interface do Planner (tela única, JS puro, conectada em `/api/planner/*`)

## Como publicar no Vercel

1. Em [vercel.com](https://vercel.com), **Add New → Project**, selecione o repositório
   `Gest-o---Devolu-o` e importe.
2. Adicione um banco Postgres ao projeto (aba **Storage** do próprio Vercel, ou qualquer
   Postgres gerenciado) — isso cria a variável `DATABASE_URL` automaticamente (ou adicione
   manualmente, se usar outro provedor).
   - **Importante:** precisa ser uma connection string padrão (`postgresql://usuario:senha@host:porta/banco`),
     não uma URL "Accelerate" (`prisma+postgres://...`) — essas não funcionam com este app.
3. Em **Environment Variables**, adicione também:
   - `AUTH_SECRET` → qualquer texto longo e aleatório
   - `BLOB_READ_WRITE_TOKEN` → necessário para anexos (crie um Blob Store na aba Storage do Vercel)
4. Clique em **Deploy**.
5. Depois do primeiro deploy, crie as tabelas e os usuários padrão da Devolução/Refaturamento
   rodando, uma única vez, a partir do seu computador (com `DATABASE_URL` apontando pro mesmo banco):
   ```
   npm install
   DATABASE_URL="a mesma URL configurada no Vercel" npm run db:seed
   ```
   Isso cria as contas de cada setor com a senha padrão `nautika@2026` (trocar depois).
   As contas do Planner são criadas pelos próprios gestores, direto na tela de login
   (botão "Criar meu planner").

## Rodando localmente para testar (opcional)
```
npm install
cp .env.local.example .env.local   # edite DATABASE_URL e AUTH_SECRET
npm run db:seed                    # cria as tabelas + usuários padrão
npm run dev
```
Depois acesse `http://localhost:3000`.

## Observações de segurança
- Senhas armazenadas com hash (bcrypt), nunca em texto puro.
- Sessão por cookie httpOnly (JWT via `jose`).
- A senha padrão dos usuários da Devolução/Refaturamento (`nautika@2026`) deve ser trocada
  por cada um após o primeiro acesso.
