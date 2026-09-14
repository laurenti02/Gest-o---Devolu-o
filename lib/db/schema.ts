import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Usuários do sistema (ADM, Diretoria, Gerente, setores)
export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  perfil: text("perfil").notNull(),
  // perfil: admin | diretoria | gerente | validacao_nfd | coleta | recebimento | entrada_nfd | financeiro
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Solicitação de devolução (formulário público)
export const solicitacoes = sqliteTable("solicitacoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  protocolo: text("protocolo").notNull().unique(),
  empresa: text("empresa").notNull(),
  cnpj: text("cnpj").notNull(),
  nomeSolicitante: text("nome_solicitante").notNull(),
  responsavelRegional: text("responsavel_regional").notNull(),
  nfOrigem: text("nf_origem").notNull(),
  valor: real("valor").notNull(),
  motivo: text("motivo").notNull(),
  // status: aguardando_aprovacao | aprovado | reprovado | em_andamento | concluido
  status: text("status").notNull().default("aguardando_aprovacao"),
  etapaAtual: text("etapa_atual"),
  // aguarda_nfd | validacao_nfd | transportes | recebimento | financeiro | concluido
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
  atualizadoEm: text("atualizado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Aprovações iniciais (Diretoria / Gerente / ADM)
export const aprovacoes = sqliteTable("aprovacoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoes.id),
  aprovadorEmail: text("aprovador_email").notNull(),
  aprovadorNome: text("aprovador_nome").notNull(),
  decisao: text("decisao").notNull(), // aprovado | reprovado
  comentario: text("comentario"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Etapas operacionais por setor (checklist com SLA)
export const etapas = sqliteTable("etapas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoes.id),
  setor: text("setor").notNull(),
  // validacao_nfd | retorno_adm | transportes | recebimento | financeiro
  ordem: integer("ordem").notNull(),
  status: text("status").notNull().default("pendente"),
  // pendente | em_andamento | concluido | bloqueado
  responsavel: text("responsavel"),
  comentario: text("comentario"),
  prazoHorasUteis: integer("prazo_horas_uteis").notNull(),
  prazoLimite: text("prazo_limite"),
  concluidoEm: text("concluido_em"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Anexo da NF de devolução + leitura inteligente
export const anexosNf = sqliteTable("anexos_nf", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoes.id),
  arquivoNome: text("arquivo_nome").notNull(),
  arquivoPath: text("arquivo_path").notNull(),
  formato: text("formato").notNull(), // pdf | xml | imagem
  numeroNota: text("numero_nota"),
  clienteLido: text("cliente_lido"),
  cnpjLido: text("cnpj_lido"),
  valorTotalLido: real("valor_total_lido"),
  itensJson: text("itens_json"), // JSON: [{codigo,descricao,quantidade,valorUnitario,valorTotal}]
  inconsistencias: text("inconsistencias"), // JSON com lista de alertas
  status: text("status").notNull().default("processando"),
  // processando | conferido | inconsistente
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Histórico / auditoria por protocolo
export const historico = sqliteTable("historico", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  solicitacaoId: integer("solicitacao_id").references(() => solicitacoes.id), // null = snapshot geral (ex.: relatório)
  usuario: text("usuario").notNull(),
  acao: text("acao").notNull(),
  comentario: text("comentario"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// REFATURAMENTO — mesmo banco, tabelas próprias (prefixo refat_)
// Fluxo: ADM aprova → Logística → Fiscal → Financeiro
// ============================================================
export const refaturamentos = sqliteTable("refat_solicitacoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  protocolo: text("protocolo").notNull().unique(),

  solicitante: text("solicitante").notNull(),
  setorSolicitante: text("setor_solicitante").notNull(),
  clienteOriginal: text("cliente_original").notNull(),
  cnpjOriginal: text("cnpj_original").notNull(),
  notaFiscalOriginal: text("nota_fiscal_original").notNull(),
  valor: real("valor").notNull(),
  mercadoriaSaiu: text("mercadoria_saiu").notNull(), // 'sim' | 'nao'
  novoDestinatario: text("novo_destinatario"),
  novoCnpj: text("novo_cnpj"),
  motivo: text("motivo").notNull(),

  // status: aguardando_aprovacao | aprovado | reprovado
  status: text("status").notNull().default("aguardando_aprovacao"),
  // etapaAtual: logistica | fiscal | financeiro | concluido (null enquanto pendente)
  etapaAtual: text("etapa_atual"),
  aprovadorEmail: text("aprovador_email"),
  aprovadorNome: text("aprovador_nome"),
  decisaoEm: text("decisao_em"),

  logTipoRegularizacao: text("log_tipo_regularizacao"), // 'Cancelamento' | 'Recusa registrada'
  logComentario: text("log_comentario"),
  logConcluidoEm: text("log_concluido_em"),
  logConcluidoPor: text("log_concluido_por"),

  fiscalChaveNfEntrada: text("fiscal_chave_nf_entrada"),
  fiscalPrecisaSefaz: integer("fiscal_precisa_sefaz", { mode: "boolean" }).notNull().default(false),
  fiscalProtocoloSefaz: text("fiscal_protocolo_sefaz"),
  fiscalChaveNovaNfe: text("fiscal_chave_nova_nfe"),
  fiscalComentario: text("fiscal_comentario"),
  fiscalConcluidoEm: text("fiscal_concluido_em"),
  fiscalConcluidoPor: text("fiscal_concluido_por"),

  finComentario: text("fin_comentario"),
  finConcluidoEm: text("fin_concluido_em"),
  finConcluidoPor: text("fin_concluido_por"),

  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
  atualizadoEm: text("atualizado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const refaturamentoHistorico = sqliteTable("refat_historico", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  refaturamentoId: integer("refaturamento_id").references(() => refaturamentos.id),
  usuario: text("usuario").notNull(),
  acao: text("acao").notNull(),
  comentario: text("comentario"),
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});
