// ---------------------------------------------------------------------------
// Camada de dados do app Gestão de Devoluções.
//
// Esta camada simula as tabelas Dataverse listadas em
// "guia-publicacao-dataverse.md" usando localStorage como armazenamento
// persistente local (substitui o InMemory volátil). Cada tabela é exposta
// como uma coleção simples (array de registros) com funções de leitura e
// gravação.
//
// QUANDO O DATAVERSE REAL ESTIVER PUBLICADO: troque as funções `readTable`
// e `writeTable` abaixo por chamadas ao Dataverse Web API
// (https://<org>.crm.dynamics.com/api/data/v9.2/<tabela>), mantendo os
// mesmos nomes de tabela e formato de registro usados neste arquivo. O
// restante do app (páginas, regras de negócio) não precisa mudar.
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "gd_"; // Gestão de Devoluções

const TABLES = {
  SOLICITACOES: "solicitacao_devolucao",
  COMPLEMENTOS: "complemento_devolucao",
  HISTORICO_APROVACAO: "historico_aprovacao",
  LIBERACAO_SETOR: "liberacao_setor",
  EVENTOS_SLA: "evento_sla",
  ANEXOS: "anexo",
  LEITURA_NF: "leitura_nf",
  ITENS_NF: "item_nf",
  CLIENTES: "cliente",
  REGIONAIS: "regional",
  SETORES: "setor",
  USUARIOS: "usuario",
  REFATURAMENTO: "refaturamento_solicitacao",
  REFATURAMENTO_ETAPAS: "refaturamento_etapa",
  LOG_OPERACIONAL: "log_operacional",
  CONFIG_OPERACIONAL: "config_operacional",
};

function readTable(table) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + table);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTable(table, records) {
  localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(records));
}

function insert(table, record) {
  const records = readTable(table);
  records.push(record);
  writeTable(table, records);
  return record;
}

function update(table, id, patch) {
  const records = readTable(table);
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch };
  writeTable(table, records);
  return records[idx];
}

function all(table) {
  return readTable(table);
}

function findById(table, id) {
  return readTable(table).find((r) => r.id === id) || null;
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Protocolo
// ---------------------------------------------------------------------------

function gerarProtocolo() {
  const now = new Date();
  const y = now.getFullYear();
  const seqKey = STORAGE_PREFIX + "protocolo_seq_" + y;
  const seq = parseInt(localStorage.getItem(seqKey) || "0", 10) + 1;
  localStorage.setItem(seqKey, String(seq));
  return `DEV-${y}-${String(seq).padStart(5, "0")}`;
}

// ---------------------------------------------------------------------------
// Setores operacionais e SLA padrão (horas úteis)
// ---------------------------------------------------------------------------

const ETAPAS_OPERACIONAIS = [
  {
    id: "adm_aprova",
    nome: "Devoluções aprova solicitação",
    setor: "Devoluções",
    slaHorasUteis: 4,
    emails: [
      "devolucao@gruponautika.com.br",
      "leidiane.morais@gruponautika.com.br",
      "victoria.sturaro@gruponautika.com.br",
    ],
  },
  {
    id: "validacao_nfd",
    nome: "Validação NFD",
    setor: "Validação NFD",
    slaHorasUteis: 8,
    emails: [
      "devolucaofiscal@gruponautika.com.br",
      "kaio.morais@gruponautika.com.br",
      "silvia.baroni@omniteca.io",
    ],
  },
  {
    id: "retorno_adm",
    nome: "Retorno ADM",
    setor: "ADM",
    slaHorasUteis: 4,
    emails: ["devolucao@gruponautika.com.br"],
  },
  {
    id: "transportes",
    nome: "Transportes — agendamento de coleta/entrega",
    setor: "Transportes",
    slaHorasUteis: 24,
    emails: [
      "matheus.calixto@gruponautika.com.br",
      "gabriel.vieira@gruponautika.com.br",
      "joice.sousa@gruponautika.com.br",
    ],
  },
  {
    id: "recebimento",
    nome: "Recebimento confere material",
    setor: "Recebimento",
    slaHorasUteis: 24,
    emails: [
      "larissa.correia@gruponautika.com.br",
      "recebimento.ntk@gruponautika.com.br",
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro conclui devolução",
    setor: "Financeiro",
    slaHorasUteis: 24,
    emails: [
      "kaline@gruponautika.com.br",
      "financeirocreditoecobranca@gruponautika.com.br",
    ],
  },
];

function addBusinessHours(startDate, hours) {
  // Simplificação: horário útil 08:00–18:00, seg-sex.
  let date = new Date(startDate);
  let remaining = hours;
  while (remaining > 0) {
    date = new Date(date.getTime() + 60 * 60 * 1000); // +1h
    const day = date.getDay();
    const h = date.getHours();
    const isBusinessTime = day >= 1 && day <= 5 && h >= 8 && h < 18;
    if (isBusinessTime) remaining -= 1;
  }
  return date;
}

function configEtapa(etapaId) {
  const overrides = readTable(TABLES.CONFIG_OPERACIONAL);
  const found = overrides.find((o) => o.etapaId === etapaId);
  const base = ETAPAS_OPERACIONAIS.find((e) => e.id === etapaId);
  if (!base) return null;
  return found ? { ...base, ...found } : base;
}

function setConfigEtapa(etapaId, patch) {
  const overrides = readTable(TABLES.CONFIG_OPERACIONAL);
  const idx = overrides.findIndex((o) => o.etapaId === etapaId);
  if (idx === -1) {
    overrides.push({ etapaId, ...patch });
  } else {
    overrides[idx] = { ...overrides[idx], ...patch };
  }
  writeTable(TABLES.CONFIG_OPERACIONAL, overrides);
}

// ---------------------------------------------------------------------------
// API de negócio
// ---------------------------------------------------------------------------

const db = {
  TABLES,
  ETAPAS_OPERACIONAIS,

  // --- Solicitações -------------------------------------------------------
  criarSolicitacao(dados) {
    const protocolo = gerarProtocolo();
    const now = new Date().toISOString();
    const solicitacao = {
      id: uid("sol"),
      protocolo,
      status: "aguardando_diretoria", // aguardando_diretoria -> aguardando_gerente -> aprovado_interno -> em_operacao -> concluido | reprovado
      etapaOperacionalAtual: null,
      criadoEm: now,
      atualizadoEm: now,
    };
    insert(TABLES.SOLICITACOES, solicitacao);
    insert(TABLES.COMPLEMENTOS, {
      id: uid("comp"),
      solicitacaoId: solicitacao.id,
      nomeEmpresa: dados.nomeEmpresa,
      cnpj: dados.cnpj,
      nomeSolicitante: dados.nomeSolicitante,
      responsavelRegional: dados.responsavelRegional,
      nfOrigem: dados.nfOrigem,
      valorNota: dados.valorNota,
      descricaoMotivo: dados.descricaoMotivo,
      criadoEm: now,
    });
    this.registrarLog({
      tipo: "criacao",
      solicitacaoId: solicitacao.id,
      mensagem: `Solicitação ${protocolo} registrada pelo formulário público.`,
    });
    return solicitacao;
  },

  buscarPorProtocolo(protocolo) {
    const norm = protocolo.trim().toUpperCase();
    return (
      all(TABLES.SOLICITACOES).find(
        (s) => s.protocolo.toUpperCase() === norm
      ) || null
    );
  },

  getComplemento(solicitacaoId) {
    return (
      all(TABLES.COMPLEMENTOS).find((c) => c.solicitacaoId === solicitacaoId) ||
      null
    );
  },

  listarSolicitacoes() {
    return all(TABLES.SOLICITACOES).sort((a, b) =>
      b.criadoEm.localeCompare(a.criadoEm)
    );
  },

  // --- Aprovações internas (Diretoria / Gerente / ADM) --------------------
  registrarAprovacao(solicitacaoId, { papel, usuario, decisao, comentario }) {
    const sol = findById(TABLES.SOLICITACOES, solicitacaoId);
    if (!sol) return null;
    const now = new Date().toISOString();

    insert(TABLES.HISTORICO_APROVACAO, {
      id: uid("hist"),
      solicitacaoId,
      papel,
      usuario,
      decisao, // aprovado | reprovado
      comentario: comentario || "",
      criadoEm: now,
    });

    if (decisao === "reprovado") {
      update(TABLES.SOLICITACOES, solicitacaoId, {
        status: "reprovado",
        atualizadoEm: now,
      });
      this.registrarLog({
        tipo: "aprovacao",
        solicitacaoId,
        mensagem: `${papel} (${usuario}) reprovou a solicitação. Motivo: ${
          comentario || "não informado"
        }`,
      });
      return findById(TABLES.SOLICITACOES, solicitacaoId);
    }

    let novoStatus = sol.status;
    if (papel === "diretoria" && sol.status === "aguardando_diretoria") {
      novoStatus = "aguardando_gerente";
    } else if (papel === "gerente" && sol.status === "aguardando_gerente") {
      novoStatus = "aguardando_adm";
    } else if (papel === "adm" && sol.status === "aguardando_adm") {
      novoStatus = "aprovado_interno";
    }

    const patch = { status: novoStatus, atualizadoEm: now };

    if (novoStatus === "aprovado_interno") {
      patch.etapaOperacionalAtual = "adm_aprova";
      patch.status = "em_operacao";
      this.iniciarEtapa(solicitacaoId, "adm_aprova");
    }

    update(TABLES.SOLICITACOES, solicitacaoId, patch);
    this.registrarLog({
      tipo: "aprovacao",
      solicitacaoId,
      mensagem: `${papel} (${usuario}) aprovou a solicitação.`,
    });
    return findById(TABLES.SOLICITACOES, solicitacaoId);
  },

  listarHistoricoAprovacao(solicitacaoId) {
    return all(TABLES.HISTORICO_APROVACAO)
      .filter((h) => h.solicitacaoId === solicitacaoId)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  },

  // --- Fluxo operacional por setor ----------------------------------------
  iniciarEtapa(solicitacaoId, etapaId) {
    const cfg = configEtapa(etapaId);
    if (!cfg) return null;
    const now = new Date();
    const prazo = addBusinessHours(now, cfg.slaHorasUteis);
    const registro = {
      id: uid("lib"),
      solicitacaoId,
      etapaId,
      setor: cfg.setor,
      responsaveis: cfg.emails,
      status: "aberta", // aberta | concluida | escalada
      criadoEm: now.toISOString(),
      prazoEm: prazo.toISOString(),
      comentario: "",
      escalada: false,
    };
    insert(TABLES.LIBERACAO_SETOR, registro);
    insert(TABLES.EVENTOS_SLA, {
      id: uid("sla"),
      solicitacaoId,
      etapaId,
      tipo: "abertura",
      criadoEm: now.toISOString(),
    });
    this.registrarLog({
      tipo: "etapa",
      solicitacaoId,
      mensagem: `Etapa "${cfg.nome}" liberada para ${cfg.setor}. Prazo: ${prazo.toLocaleString(
        "pt-BR"
      )}.`,
    });
    return registro;
  },

  listarLiberacoesPorSolicitacao(solicitacaoId) {
    return all(TABLES.LIBERACAO_SETOR)
      .filter((l) => l.solicitacaoId === solicitacaoId)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  },

  listarLiberacoesAbertasPorSetor(setor) {
    return all(TABLES.LIBERACAO_SETOR).filter(
      (l) => l.setor === setor && l.status === "aberta"
    );
  },

  // Histórico completo do setor (todas as liberações já recebidas pelo
  // time, abertas ou concluídas), mais recentes primeiro.
  listarLiberacoesPorSetorTodas(setor) {
    return all(TABLES.LIBERACAO_SETOR)
      .filter((l) => l.setor === setor)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },

  listarTodasLiberacoesAbertas() {
    return all(TABLES.LIBERACAO_SETOR).filter((l) => l.status === "aberta");
  },

  concluirEtapa(liberacaoId, { usuario, comentario, resultado }) {
    const lib = findById(TABLES.LIBERACAO_SETOR, liberacaoId);
    if (!lib) return null;
    const now = new Date().toISOString();
    update(TABLES.LIBERACAO_SETOR, liberacaoId, {
      status: "concluida",
      comentario: comentario || "",
      resultado: resultado || "ok",
      concluidoPor: usuario,
      concluidoEm: now,
    });
    insert(TABLES.EVENTOS_SLA, {
      id: uid("sla"),
      solicitacaoId: lib.solicitacaoId,
      etapaId: lib.etapaId,
      tipo: "conclusao",
      criadoEm: now,
    });
    this.registrarLog({
      tipo: "etapa",
      solicitacaoId: lib.solicitacaoId,
      mensagem: `Etapa "${
        configEtapa(lib.etapaId)?.nome || lib.etapaId
      }" concluída por ${usuario}.`,
    });
    this.avancarProximaEtapa(lib.solicitacaoId, lib.etapaId);
    return findById(TABLES.LIBERACAO_SETOR, liberacaoId);
  },

  avancarProximaEtapa(solicitacaoId, etapaConcluidaId) {
    const ordem = ETAPAS_OPERACIONAIS.map((e) => e.id);
    const idx = ordem.indexOf(etapaConcluidaId);
    const proxima = ordem[idx + 1];
    const now = new Date().toISOString();

    if (!proxima) {
      update(TABLES.SOLICITACOES, solicitacaoId, {
        status: "concluido",
        etapaOperacionalAtual: null,
        atualizadoEm: now,
      });
      this.registrarLog({
        tipo: "conclusao",
        solicitacaoId,
        mensagem: "Financeiro concluiu a etapa final. Processo encerrado.",
      });
      return;
    }

    update(TABLES.SOLICITACOES, solicitacaoId, {
      etapaOperacionalAtual: proxima,
      status:
        proxima === "validacao_nfd" ? "aguardando_nfd" : "em_operacao",
      atualizadoEm: now,
    });

    // A etapa "validacao_nfd" só é liberada de fato quando o solicitante
    // envia a NF de devolução (ver marcarNFEnviada). As demais etapas
    // seguem automaticamente.
    if (proxima !== "validacao_nfd") {
      this.iniciarEtapa(solicitacaoId, proxima);
    }
  },

  marcarNFEnviada(solicitacaoId) {
    const sol = findById(TABLES.SOLICITACOES, solicitacaoId);
    if (!sol) return null;
    if (sol.etapaOperacionalAtual === "validacao_nfd") {
      this.iniciarEtapa(solicitacaoId, "validacao_nfd");
      update(TABLES.SOLICITACOES, solicitacaoId, { status: "em_operacao" });
    }
    return findById(TABLES.SOLICITACOES, solicitacaoId);
  },

  // Verifica etapas vencidas e registra escalonamento. Chamar periodicamente
  // (ex.: ao abrir o Painel ADM).
  verificarEscalonamentos() {
    const abertas = this.listarTodasLiberacoesAbertas();
    const now = new Date();
    let escaladas = 0;
    abertas.forEach((lib) => {
      if (lib.escalada) return;
      if (new Date(lib.prazoEm) < now) {
        update(TABLES.LIBERACAO_SETOR, lib.id, { escalada: true });
        insert(TABLES.EVENTOS_SLA, {
          id: uid("sla"),
          solicitacaoId: lib.solicitacaoId,
          etapaId: lib.etapaId,
          tipo: "escalonamento",
          criadoEm: now.toISOString(),
        });
        const cfg = configEtapa(lib.etapaId);
        this.registrarLog({
          tipo: "escalonamento",
          solicitacaoId: lib.solicitacaoId,
          mensagem: `Prazo da etapa "${
            cfg?.nome || lib.etapaId
          }" vencido. E-mail de escalonamento enviado para ${(
            cfg?.emails || []
          ).join(", ")}.`,
        });
        escaladas += 1;
      }
    });
    return escaladas;
  },

  // --- Configuração de SLA por etapa (ADM) --------------------------------
  configEtapa,
  setConfigEtapa,

  // --- Anexos e leitura de NF ---------------------------------------------
  registrarAnexo({ solicitacaoId, arquivo, tipo }) {
    const registro = {
      id: uid("anx"),
      solicitacaoId,
      nomeArquivo: arquivo.name,
      tamanho: arquivo.size,
      tipo,
      criadoEm: new Date().toISOString(),
    };
    insert(TABLES.ANEXOS, registro);
    return registro;
  },

  listarAnexos(solicitacaoId) {
    return all(TABLES.ANEXOS).filter((a) => a.solicitacaoId === solicitacaoId);
  },

  registrarLeituraNF({ solicitacaoId, numeroNota, cliente, cnpj, valorTotal, itens, inconsistencias }) {
    const leitura = {
      id: uid("lnf"),
      solicitacaoId,
      numeroNota,
      cliente,
      cnpj,
      valorTotal,
      inconsistencias: inconsistencias || [],
      criadoEm: new Date().toISOString(),
    };
    insert(TABLES.LEITURA_NF, leitura);
    (itens || []).forEach((item) => {
      insert(TABLES.ITENS_NF, { id: uid("itnf"), leituraId: leitura.id, ...item });
    });
    return leitura;
  },

  getLeituraNF(solicitacaoId) {
    return (
      all(TABLES.LEITURA_NF).find((l) => l.solicitacaoId === solicitacaoId) ||
      null
    );
  },

  listarItensNF(leituraId) {
    return all(TABLES.ITENS_NF).filter((i) => i.leituraId === leituraId);
  },

  // --- Log operacional -----------------------------------------------------
  registrarLog({ tipo, solicitacaoId, mensagem }) {
    insert(TABLES.LOG_OPERACIONAL, {
      id: uid("log"),
      tipo,
      solicitacaoId,
      mensagem,
      criadoEm: new Date().toISOString(),
    });
  },

  listarLog(solicitacaoId) {
    return all(TABLES.LOG_OPERACIONAL)
      .filter((l) => !solicitacaoId || l.solicitacaoId === solicitacaoId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },

  // --- Refaturamento --------------------------------------------------------
  ETAPAS_REFATURAMENTO: ["Logística", "Fiscal", "ADM", "Comercial", "Financeiro"],

  criarRefaturamento(dados) {
    const protocolo = "REF-" + gerarProtocolo().replace("DEV-", "");
    const now = new Date().toISOString();
    const registro = {
      id: uid("ref"),
      protocolo,
      ...dados,
      etapaAtual: "Logística",
      status: "em_andamento",
      criadoEm: now,
    };
    insert(TABLES.REFATURAMENTO, registro);
    const prazo = addBusinessHours(new Date(), 24);
    insert(TABLES.REFATURAMENTO_ETAPAS, {
      id: uid("refet"),
      refaturamentoId: registro.id,
      etapa: "Logística",
      status: "aberta",
      criadoEm: now,
      prazoEm: prazo.toISOString(),
    });
    return registro;
  },

  listarRefaturamentos() {
    return all(TABLES.REFATURAMENTO).sort((a, b) =>
      b.criadoEm.localeCompare(a.criadoEm)
    );
  },

  listarEtapasRefaturamento(refaturamentoId) {
    return all(TABLES.REFATURAMENTO_ETAPAS)
      .filter((e) => e.refaturamentoId === refaturamentoId)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  },

  avancarRefaturamento(refaturamentoId, { usuario, comentario }) {
    const ref = findById(TABLES.REFATURAMENTO, refaturamentoId);
    if (!ref) return null;
    const etapas = this.ETAPAS_REFATURAMENTO;
    const idxAtual = etapas.indexOf(ref.etapaAtual);
    const now = new Date().toISOString();

    const etapaAbertaAtual = all(TABLES.REFATURAMENTO_ETAPAS).find(
      (e) => e.refaturamentoId === refaturamentoId && e.status === "aberta"
    );
    if (etapaAbertaAtual) {
      update(TABLES.REFATURAMENTO_ETAPAS, etapaAbertaAtual.id, {
        status: "concluida",
        comentario,
        usuario,
        concluidoEm: now,
      });
    }

    const proxima = etapas[idxAtual + 1];
    if (!proxima) {
      update(TABLES.REFATURAMENTO, refaturamentoId, {
        status: "concluido",
        atualizadoEm: now,
      });
      return findById(TABLES.REFATURAMENTO, refaturamentoId);
    }

    update(TABLES.REFATURAMENTO, refaturamentoId, {
      etapaAtual: proxima,
      atualizadoEm: now,
    });
    const prazo = addBusinessHours(new Date(), 24);
    insert(TABLES.REFATURAMENTO_ETAPAS, {
      id: uid("refet"),
      refaturamentoId,
      etapa: proxima,
      status: "aberta",
      criadoEm: now,
      prazoEm: prazo.toISOString(),
    });
    return findById(TABLES.REFATURAMENTO, refaturamentoId);
  },

  // --- Utilitário: limpar toda a base local (apenas para demonstração) ----
  resetarBaseDemo() {
    Object.values(TABLES).forEach((t) => writeTable(t, []));
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX + "protocolo_seq_"))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export default db;
export { addBusinessHours };
