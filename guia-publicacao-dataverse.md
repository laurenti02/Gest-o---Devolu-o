# Guia de publicação Dataverse

Este guia orienta a publicação das tabelas do app Gestão de Devoluções no Dataverse para substituir o armazenamento temporário InMemory por armazenamento real.

## Objetivo

Publicar as tabelas permitidas no Dataverse, liberar gravação para o app e deixar o fluxo pronto para registrar solicitações, aprovações, anexos, logs ADM, etapas por setor e eventos de SLA.

## Pré-requisitos

- Acesso ao ambiente Power Apps usado pelo app.
- Permissão de administrador, maker ou proprietário da solução.
- Dataverse habilitado no ambiente.
- Conexão corporativa com permissão de criar/editar tabelas.
- Conta ADM prevista para operação: devolucao@gruponautika.com.br.

## Tabelas do app

Publique ou confirme as tabelas equivalentes abaixo no Dataverse:

- Solicitação de Devolução
- Complemento da Devolução
- Histórico de Aprovação
- Liberação por Setor
- Evento de SLA
- Teams Update Log
- Anexo
- Leitura NF
- Item da NF
- Cliente
- Regional
- Setor
- Usuário

## Passo a passo

1. Acesse Power Apps em make.powerapps.com.
2. Selecione o ambiente correto no topo da tela.
3. Abra Dataverse > Tabelas.
4. Crie ou localize cada tabela listada neste guia.
5. Confirme que cada tabela está publicada, ativa e com nome lógico estável.
6. Em cada tabela, revise colunas obrigatórias, tipos de dados e relacionamentos.
7. Publique todas as personalizações.
8. Abra Soluções e confirme que as tabelas estão dentro da solução do app, quando aplicável.
9. Abra o app Gestão de Devoluções no Power Apps Studio.
10. Em Dados, adicione as tabelas Dataverse publicadas.
11. Remova ou substitua fontes temporárias InMemory, se a interface permitir.
12. Salve e publique o app.
13. Teste criando uma solicitação real e confirmando o registro na tabela Solicitação de Devolução.

## Permissões recomendadas

- Solicitante: criar solicitação e complemento; não acessar painéis administrativos.
- Aprovador: ler solicitações pendentes e criar histórico de aprovação.
- ADM: ler, criar e atualizar todas as tabelas operacionais do fluxo.
- Setores operacionais: atualizar liberações por setor e eventos de SLA conforme responsabilidade.

## Validação após publicação

Use este checklist antes de liberar para produção:

- Uma nova solicitação aparece no Dataverse.
- O protocolo permanece salvo após atualizar a página.
- Aprovações de Gabriela/Tiago gravam histórico.
- Aprovação ou rejeição ADM grava log com motivo e responsável.
- Etapas setoriais gravam status, prazo e responsável.
- Anexos e leitura de NF ficam vinculados ao protocolo.
- Painel ADM mostra dados persistidos, não apenas amostras locais.
- O banner de armazenamento pode ser atualizado para indicar Dataverse conectado.

## Depois de publicar

Quando as tabelas estiverem publicadas e conectadas no ambiente, peça para conectar o app ao Dataverse real. A partir daí, a camada de dados pode ser regenerada para usar as tabelas publicadas e o banner de armazenamento pode ser ajustado para mostrar armazenamento real ativo.
