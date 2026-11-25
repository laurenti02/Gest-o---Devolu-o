# Planner Administrativo Comercial — Grupo Nautika

App web com login por e-mail/senha. Cada gestor tem sua própria conta e seus
próprios dados, salvos num banco de dados na nuvem — acessível de qualquer
computador, bastando abrir o link e entrar com e-mail e senha.

## O que tem aqui
- `app.js` — o app (Node + Express): rotas, API, servidor de arquivos
- `server.js` — liga o app numa porta fixa (usado no Railway/local)
- `api/index.js` + `vercel.json` — ponto de entrada usado só quando hospedado no Vercel
- `routes/auth.js` — cadastro, login, logout, troca de senha
- `routes/planner.js` — carregar/salvar os dados do planner de cada usuário
- `prisma/schema.prisma` — estrutura do banco (usuários + dados do planner)
- `public/index.html` — o app (mesma interface que você já aprovou, agora
  conectada ao servidor em vez de salvar só no navegador)

## Como publicar (Railway — recomendado, mesmo serviço usado no NexoNetiq)

1. Crie um repositório no GitHub com esta pasta e suba o código.
2. No [Railway](https://railway.app), clique em **New Project → Deploy from GitHub repo**
   e selecione o repositório.
3. Ainda no projeto, clique em **New → Database → PostgreSQL** para criar o banco.
   O Railway já injeta a variável `DATABASE_URL` automaticamente no serviço do app
   (confirme em **Variables** do serviço do app que ela está lá).
4. No serviço do app, vá em **Variables** e adicione:
   - `JWT_SECRET` → qualquer texto longo e aleatório (ex: gere em
     https://1password.com/password-generator ou rode `openssl rand -hex 32`)
   - `NODE_ENV` → `production`
5. Em **Settings → Deploy**, confirme:
   - Build command: `npm install` (o Railway detecta sozinho, mas pode confirmar)
   - Start command: `npm start`
6. Após o primeiro deploy, rode a migração do banco uma única vez. No Railway,
   abra o serviço do app → **Settings → Deploy Logs** ou use o botão de terminal
   (**Shell**) e rode:
   ```
   npx prisma migrate deploy
   ```
   Isso cria as tabelas `User` e `PlannerData` no Postgres.
7. Em **Settings → Networking**, clique em **Generate Domain** para receber o
   link público (algo como `planner-nautika.up.railway.app`). Esse é o link que
   todo mundo na empresa vai usar.

## Como publicar (Vercel)

O Vercel só hospeda o app; o banco de dados (Postgres) continua no Railway —
é só apontar o app para ele usando a URL **pública** do banco.

1. Entre em [vercel.com](https://vercel.com) e faça login (pode ser com a conta do GitHub).
2. Clique em **Add New → Project** e selecione o repositório `Planner-Nautika`.
3. Deixe o **Framework Preset** como `Other` e o **Build Command** em branco
   (o Vercel instala e gera o Prisma Client sozinho via `npm install`).
4. Antes de clicar em Deploy, abra **Environment Variables** e adicione:
   - `DATABASE_URL` → a URL **pública** do Postgres do Railway (veja abaixo
     como pegar essa URL — é diferente da que o app usa dentro do Railway)
   - `JWT_SECRET` → qualquer texto longo e aleatório (pode ser um novo, diferente
     do usado no Railway — quem estiver logado só vai precisar entrar de novo)
   - `NODE_ENV` → `production`
5. Clique em **Deploy** e espere terminar (1-2 minutos).
6. Pegue o link que o Vercel gerou (algo como `planner-nautika.vercel.app`) —
   esse é o novo link para a empresa usar.

### Pegando a URL pública do Postgres no Railway
No projeto do Railway, clique no serviço **Postgres** → aba **Variables** (ou
**Connect**) → procure por `DATABASE_PUBLIC_URL` (ou a conexão listada como
"Public Network"/TCP Proxy). Copie esse valor — ele começa com `postgresql://`
e tem um endereço público (algo como `...railway.app:PORTA`), diferente do
`postgres.railway.internal` que só funciona dentro do próprio Railway.

As tabelas já existem nesse banco (foram criadas quando publicamos no Railway),
então não precisa rodar `prisma migrate` de novo — é só conectar.

## Como cada gestor usa
1. Abre o link no navegador (celular, notebook, qualquer computador).
2. Na primeira vez, clica em **"Criar meu planner"**, preenche nome, e-mail e senha.
3. Da próxima vez, é só **entrar com e-mail e senha** — os dados aparecem
   iguais, não importa de qual computador esteja acessando.
4. Cada gestor só vê os próprios dados. Ninguém vê o planner de outra pessoa.

## Rodando localmente para testar (opcional)
```
npm install
cp .env.example .env    # edite DATABASE_URL e JWT_SECRET
npx prisma migrate dev  # cria as tabelas no banco local/de teste
npm start
```
Depois acesse `http://localhost:3000`.

## Observações de segurança
- As senhas são armazenadas com hash (bcrypt) — nunca em texto puro.
- O login usa cookie de sessão (httpOnly), válido por 30 dias.
- Para trocar o texto de erro genérico, redefinir senha de alguém ou remover
  um usuário, use o **Shell** do Railway com `npx prisma studio` (abre uma
  interface visual do banco) ou peça ajuda para ajustar isso no código.
