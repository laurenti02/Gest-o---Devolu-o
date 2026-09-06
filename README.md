# Gestão de Devoluções — Grupo Nautika (NTK)

Aplicativo web completo para o fluxo de devoluções: formulário público de
solicitação, aprovações internas (Diretoria → Gerência → ADM), fluxo
operacional por setor com SLA, anexos e leitura de NF, refaturamento e
painel administrativo.

Este projeto é um **protótipo funcional e completo**, pronto para rodar
localmente. Ele usa uma camada de dados em memória/localStorage que espelha
as tabelas descritas em `guia-publicacao-dataverse.md`, para que a migração
para o Dataverse real seja direta (ver seção final).

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. A página inicial é o formulário público
(sem login). Para acessar as páginas internas, abra `/entrar` e escolha um
dos perfis de demonstração (Diretoria, Gerência, ADM ou um usuário de
setor) — isso simula a identidade que, em produção, viria do login
Microsoft 365.

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos finais ficam em `dist/`.

## Fluxo implementado

1. **Formulário público (`/`)** — cadastro da devolução, geração de
   protocolo, busca por protocolo, botão "Já solicitei".
2. **Aprovações (`/aprovacoes`)** — fila para Diretoria (Gabriela), Gerência
   (Tiago) e ADM. Aprovar avança a solicitação; reprovar exige comentário e
   encerra o fluxo.
3. **Envio da NF de devolução (`/ja-solicitei`)** — liberado somente após as
   aprovações internas; simula validação, leitura inteligente e registro do
   anexo.
4. **Fluxo operacional automático** — após aprovado, a solicitação passa
   por: ADM aprova → Validação NFD → Retorno ADM → Transportes →
   Recebimento → Financeiro, cada etapa com SLA em horas úteis e prazo
   calculado automaticamente.
5. **Painel do setor (`/painel-setor`)** — fila de pendências do setor
   logado, com comentário livre e botão "Liberar próxima etapa".
6. **Painel ADM (`/painel-adm`)** — cinco abas: Solicitações, Visão geral,
   SLA, Arquivos e Configurações (incluindo SLA configurável por etapa).
7. **Relatório de aprovações (`/relatorio-aprovacoes`)** — totais,
   histórico de decisões e exportação CSV.
8. **Anexos (`/anexos`)** — evidências e leitura da NF por protocolo.
9. **Refaturamento (`/refaturamento`)** — fluxo próprio por Logística,
   Fiscal, ADM, Comercial e Financeiro, com SLA de 24h corridas por etapa.

## Estrutura

```
src/
  lib/
    db.js        // camada de dados (tabelas + regras de negócio)
    auth.jsx      // identidade simulada (placeholder MSAL)
    format.js     // formatação de moeda, data e status
  components/
    InternalShell.jsx   // layout interno (sidebar)
    RequireRole.jsx     // proteção de rota por perfil
    StatusBadge.jsx
  pages/
    Home.jsx, StatusPublico.jsx, JaSolicitei.jsx   // páginas públicas
    Entrar.jsx                                      // login simulado
    Aprovacoes.jsx, RelatorioAprovacoes.jsx
    PainelSetor.jsx, Anexos.jsx, Refaturamento.jsx
    painel_adm/PainelADM.jsx                        // 5 abas
```

## Próximos passos para produção

### 1. Autenticação Microsoft 365 (MSAL)

Troque `src/lib/auth.jsx` por `@azure/msal-react`. O perfil do usuário
(Administrador, Diretoria, Gerência, setor) deve vir da tabela Dataverse
**Usuário**, cruzada pelo e-mail autenticado — não por seleção manual.

### 2. Dataverse real

Siga `guia-publicacao-dataverse.md` para publicar as tabelas. Depois, troque
as funções `readTable`/`writeTable` em `src/lib/db.js` por chamadas ao
Dataverse Web API (`/api/data/v9.2/<tabela>`), mantendo os mesmos nomes de
tabela e formato de registro já usados — o restante do app não precisa
mudar. As tabelas usadas neste protótipo (`db.TABLES`) já seguem a
nomenclatura do guia: `solicitacao_devolucao`, `complemento_devolucao`,
`historico_aprovacao`, `liberacao_setor`, `evento_sla`, `anexo`,
`leitura_nf`, `item_nf`, `log_operacional`, `config_operacional`.

### 3. Envio de e-mail real

As notificações de liberação de etapa e escalonamento hoje são apenas
registradas em log (`db.registrarLog`). Em produção, conecte esse ponto a
um serviço de e-mail (Power Automate, Graph API, etc.).

### 4. Leitura de NF

A leitura inteligente da NF em `JaSolicitei.jsx` está simulada. Substitua
por um serviço real de OCR/leitura fiscal que valide CNPJ, valor total e
soma dos itens antes do registro.
