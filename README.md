# NTK Devoluções — Grupo Nautika

App web de Controle de Solicitações de Devolução: formulário público com protocolo,
aprovação dupla obrigatória (Diretoria + Gerente), fluxo por setor com SLA, leitura
inteligente da NF de devolução (XML NFe / PDF) e relatórios exportáveis (CSV/Excel).

Construído fora do Power Apps/Dataverse para ter deploy e evolução rápidos: Next.js +
Drizzle ORM + SQLite (troca simples para Postgres quando for para produção — ver abaixo).

## Planner Administrativo Comercial (também no mesmo app, login separado)

Terceiro módulo dentro do mesmo projeto/banco/deploy. Diferente do Refaturamento, o
Planner **não reaproveita** os perfis da Devolução — cada pessoa cria sua própria
conta (nome, e-mail, senha), sem perfil fixo, exatamente como no app original.

- **Acesso:** `/planner` — tela de login/cadastro própria.
- **Sessão separada de verdade:** cookie `planner_session`, diferente do `ntk_session`
  usado pela Devolução/Refaturamento. Um não autentica no outro.
- **Dados:** cada usuário tem seu próprio registro JSON (Painel, Metas, Agenda,
  Planejamento semanal, Funil de vendas, Carteira de clientes, Tarefas administrativas)
  nas tabelas `planner_usuarios` e `planner_dados`, no mesmo banco SQLite/libSQL.
- **Controle de Cartão Corporativo removido** a pedido — não existe mais essa aba,
  nem nos dados de contas novas, nem nos cálculos do Painel.
- **Front-end:** é o mesmo HTML/CSS/JS do Planner original (não foi reescrito em
  React) — servido em `/planner` via `app/planner/route.ts`, que lê
  `public/planner-app.html` e devolve como página comum. Só as chamadas de API
  internas foram redirecionadas para os novos endpoints (`/api/planner/...`).
- **Teste automatizado:** `node test/test-e2e-planner.mjs` (com `npm start` já
  rodando) — cobre cadastro, isolamento de sessão, salvar/carregar dados, troca de
  senha e logout.

## Refaturamento (novo módulo, mesmo app e mesmo banco)

Fluxo separado, mas vivendo dentro deste mesmo projeto/banco/deploy — sem precisar de
um serviço novo no Railway:

**Fluxo:** ADM aprova → Logística regulariza a mercadoria → Fiscal emite os documentos
→ Financeiro concilia e conclui.

**Contas:** para simplificar, o Refaturamento reaproveita perfis que já existem na
Devolução, sempre que é o mesmo time cuidando da mesma função:
- **ADM** → mesmo perfil `admin` de sempre (devolucao@, leidiane.morais@, victoria.sturaro@)
- **Fiscal** → mesmo perfil `entrada_nfd` de sempre (fiscal@, kaio.morais@, silvia.baroni@)
- **Financeiro** → mesmo perfil `financeiro` de sempre (kaline@, financeirocreditoecobranca@)
- **Logística** → única conta nova: `logistica@gruponautika.com.br` (perfil `logistica`)

Todas usam a mesma senha padrão do sistema (`nautika@2026`).

**Páginas:**
- `/refaturamento` — formulário público (gera protocolo `REF-AAAA-NNNNNN`)
- `/refaturamento/protocolo/[protocolo]` — status público
- `/refaturamento/aprovacoes` — fila do ADM
- `/refaturamento/painel` — fila de trabalho por etapa (Logística/Fiscal/Financeiro), ou tudo, se ADM

**Tabelas:** `refat_solicitacoes` e `refat_historico`, no mesmo arquivo SQLite/banco
libSQL da Devolução — nomes prefixados para nunca colidir com as tabelas existentes.

**Teste automatizado:** `node test/test-e2e-refaturamento.mjs` (com o servidor já
rodando em `npm start`) — cobre criação pública, as 4 contas, permissões cruzadas e
persistência de cada etapa.

## Como rodar na nuvem (Vercel + Turso — gratuito, sem cartão de crédito)

O app guarda dados em SQLite (via libSQL) e os anexos de NF em arquivo. A Vercel não
tem disco persistente (ambiente serverless), então em produção o app usa dois serviços
externos gratuitos no lugar do disco: **Turso** (banco remoto, mesmo protocolo libSQL
que o app já usa) e **Vercel Blob** (armazenamento de arquivos). Sem as variáveis de
ambiente abaixo configuradas, o app cai automaticamente para arquivo local — então
continua funcionando normalmente em desenvolvimento, só não persiste em produção sem
elas.

### 1. Criar o banco no Turso
1. Crie uma conta em https://turso.tech (dá para entrar com GitHub).
2. Instale a CLI do Turso e crie o banco:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   turso db create nautika-app
   turso db show nautika-app --url
   turso db tokens create nautika-app
   ```
   Guarde a URL (começa com `libsql://...`) e o token gerados.
3. Rode a criação das tabelas e o cadastro das contas iniciais **a partir do seu
   computador**, apontando para o banco remoto:
   ```bash
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
   ```
   (No Windows/PowerShell: `$env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="..."; npm run db:seed`)

### 2. Criar o armazenamento de arquivos (Vercel Blob)
Isso é feito depois do projeto já existir na Vercel (passo 3), direto pelo painel —
veja a instrução no passo 4.

### 3. Publicar na Vercel
1. Crie uma conta em https://vercel.com (dá para entrar com GitHub).
2. **Add New → Project**, selecione o repositório deste app no GitHub.
3. A Vercel detecta Next.js automaticamente — não precisa mudar nada no build.
4. Antes de clicar em "Deploy", abra **Environment Variables** e adicione:
   ```
   AUTH_SECRET=uma-chave-longa-e-aleatoria
   TURSO_DATABASE_URL=libsql://... (a URL do passo 1)
   TURSO_AUTH_TOKEN=... (o token do passo 1)
   ```
5. Clique em **Deploy** e espere terminar.
6. No projeto já criado, vá em **Storage → Create Database → Blob**. A Vercel já
   injeta a variável `BLOB_READ_WRITE_TOKEN` sozinha — não precisa copiar nada
   manualmente. Isso dispara um novo deploy automático.
7. Acesse o domínio que a Vercel gerou (tipo `seu-app.vercel.app`) — é ele que o time
   vai usar.

Cada `git push` no repositório já publica uma nova versão sozinho — não precisa de
nenhum comando manual depois do primeiro deploy.

## Rodar no servidor da empresa (Windows)

Se preferir manter localmente em vez da nuvem, os arquivos `instalar-windows.bat` e
`iniciar-servidor.bat` na raiz do projeto fazem a instalação e a inicialização.

## Rodar localmente (desenvolvimento, qualquer sistema)

Pré-requisitos: Node.js 20+.

```bash
npm install
npm run db:seed      # cria o banco e os 16 usuários iniciais
npm run dev           # http://localhost:3000
```

Para rodar em modo produção:

```bash
npm run build
npm start
```

## Login e senha inicial

Todos os usuários (Gabriela, Tiago, ADM, setores, etc.) foram criados com a senha:

```
nautika@2026
```

**Troque essa senha em produção.** Hoje a troca é feita direto no banco (gerando um
novo hash com bcrypt); posso adicionar uma tela de "trocar senha" se quiser.

Acesso interno: `/login`
Formulário público: `/` (não exige login)

## Perfis cadastrados

| Perfil | E-mails |
|---|---|
| admin | devolucao@gruponautika.com.br, leidiane.morais@..., victoria.sturaro@... |
| diretoria | gabriela@gruponautika.com.br |
| gerente | tiago@gruponautika.com.br |
| validacao_nfd | devolucaofiscal@..., kaio.morais@..., silvia.baroni@omniteca.io |
| coleta | matheus.calixto@..., gabriel.vieira@..., joice.sousa@... |
| recebimento | larissa.correia@..., recebimento.ntk@... |
| entrada_nfd | fiscal@..., kaio.morais@..., silvia.baroni@omniteca.io |
| financeiro | kaline@..., financeirocreditoecobranca@... |

## Páginas

- `/` — formulário público de solicitação (gera protocolo)
- `/ja-solicitei` — busca de protocolo
- `/protocolo/[protocolo]` — status público + upload da NF de devolução
- `/login` — acesso interno
- `/aprovacoes` — fila de aprovação (Diretoria, Gerente, ADM)
- `/admin` — painel geral (ADM)
- `/setor` — painel Kanban do setor logado (ou todos, se ADM)
- `/relatorio` — indicadores + **download de relatório em CSV e Excel** + snapshot

## Fluxo implementado

1. Solicitante preenche o formulário → protocolo gerado.
2. Fica bloqueado até aprovação da **Diretoria e do Gerente** (ambas obrigatórias).
   Se qualquer um reprovar, a solicitação é encerrada como reprovada.
3. Aprovado → solicitante anexa a NF de devolução na página do protocolo. O sistema
   lê o XML NFe automaticamente (número, CNPJ, valor, itens) e sinaliza inconsistências
   (ex.: CNPJ divergente, soma dos itens ≠ valor total). PDF usa leitura heurística por
   texto; imagens ficam marcadas para conferência manual.
4. A partir daí o fluxo passa pelos setores, cada um com SLA e prazo calculado em horas
   úteis (seg-sex, 08h-18h): Validação NFD (8h) → Retorno ADM (4h) → Transportes (24h)
   → Recebimento (24h) → Financeiro (24h). Cada setor conclui sua etapa no Kanban de
   `/setor`, o que libera automaticamente a próxima.
5. Tudo fica registrado no histórico (auditoria) por protocolo.

## Relatórios

Na página `/relatorio` (Diretoria, Gerente ou ADM):
- Indicadores: total, aprovadas, reprovadas, pendentes, valor total aprovado.
- Tabela com todas as solicitações e decisões.
- **Baixar CSV** e **Baixar Excel** — download direto do relatório completo.
- **Salvar snapshot** — grava um resumo no histórico com o marcador
  `RELATORIO-APROVACOES`, para referência futura.

## Banco de dados

Usa SQLite via libSQL + Drizzle ORM — leve e sem dependência de compilação nativa. O
schema está em `lib/db/schema.ts` e o SQL de criação em `lib/db/init.sql`.

Dois modos, escolhidos automaticamente por `lib/db/index.ts` conforme as variáveis de
ambiente:
- **Sem `TURSO_DATABASE_URL` configurada** → usa um arquivo local (`data/devolucoes.db`).
  Bom para desenvolvimento; não persiste em hospedagens sem disco persistente (Vercel).
- **Com `TURSO_DATABASE_URL` configurada** → conecta no banco remoto Turso (mesmo
  protocolo libSQL, nenhuma outra mudança de código). É o modo usado em produção na
  Vercel — veja "Como rodar na nuvem" acima.

## Variáveis de ambiente

Crie um `.env.local` (veja `.env.local.example` para a lista completa com comentários):

```
AUTH_SECRET=uma-chave-secreta-longa-e-aleatoria
TURSO_DATABASE_URL=            # vazio = usa arquivo local; preenchido = usa Turso
TURSO_AUTH_TOKEN=
BLOB_READ_WRITE_TOKEN=         # vazio = salva anexos em public/uploads; preenchido = usa Vercel Blob
```

## Próximos passos sugeridos

- Tela de troca de senha / gestão de usuários pelo ADM (a Devolução ainda não tem;
  o Planner já tem, em `/planner`).
- Notificações por e-mail nas mudanças de etapa (hoje fica só no histórico do app).
- Leitura inteligente de PDF/imagem via IA (hoje é heurística por regex para PDF, e
  manual para imagem) — se quiser mais precisão, dá para plugar um modelo de visão.
