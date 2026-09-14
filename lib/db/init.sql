CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocolo TEXT NOT NULL UNIQUE,
  empresa TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  nome_solicitante TEXT NOT NULL,
  responsavel_regional TEXT NOT NULL,
  nf_origem TEXT NOT NULL,
  valor REAL NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_aprovacao',
  etapa_atual TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aprovacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id),
  aprovador_email TEXT NOT NULL,
  aprovador_nome TEXT NOT NULL,
  decisao TEXT NOT NULL,
  comentario TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etapas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id),
  setor TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel TEXT,
  comentario TEXT,
  prazo_horas_uteis INTEGER NOT NULL,
  prazo_limite TEXT,
  concluido_em TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anexos_nf (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id),
  arquivo_nome TEXT NOT NULL,
  arquivo_path TEXT NOT NULL,
  formato TEXT NOT NULL,
  numero_nota TEXT,
  cliente_lido TEXT,
  cnpj_lido TEXT,
  valor_total_lido REAL,
  itens_json TEXT,
  inconsistencias TEXT,
  status TEXT NOT NULL DEFAULT 'processando',
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER REFERENCES solicitacoes(id),
  usuario TEXT NOT NULL,
  acao TEXT NOT NULL,
  comentario TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refat_solicitacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocolo TEXT NOT NULL UNIQUE,
  solicitante TEXT NOT NULL,
  setor_solicitante TEXT NOT NULL,
  cliente_original TEXT NOT NULL,
  cnpj_original TEXT NOT NULL,
  nota_fiscal_original TEXT NOT NULL,
  valor REAL NOT NULL,
  mercadoria_saiu TEXT NOT NULL,
  novo_destinatario TEXT,
  novo_cnpj TEXT,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_aprovacao',
  etapa_atual TEXT,
  aprovador_email TEXT,
  aprovador_nome TEXT,
  decisao_em TEXT,
  log_tipo_regularizacao TEXT,
  log_comentario TEXT,
  log_concluido_em TEXT,
  log_concluido_por TEXT,
  fiscal_chave_nf_entrada TEXT,
  fiscal_precisa_sefaz INTEGER NOT NULL DEFAULT 0,
  fiscal_protocolo_sefaz TEXT,
  fiscal_chave_nova_nfe TEXT,
  fiscal_comentario TEXT,
  fiscal_concluido_em TEXT,
  fiscal_concluido_por TEXT,
  fin_comentario TEXT,
  fin_concluido_em TEXT,
  fin_concluido_por TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refat_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  refaturamento_id INTEGER REFERENCES refat_solicitacoes(id),
  usuario TEXT NOT NULL,
  acao TEXT NOT NULL,
  comentario TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_protocolo ON solicitacoes(protocolo);
CREATE INDEX IF NOT EXISTS idx_etapas_solicitacao ON etapas(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_solicitacao ON aprovacoes(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_refat_protocolo ON refat_solicitacoes(protocolo);
CREATE INDEX IF NOT EXISTS idx_refat_historico ON refat_historico(refaturamento_id);
