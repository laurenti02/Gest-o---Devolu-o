import { useEffect, useState } from "react";
import db from "../../lib/db";
import InternalShell from "../../components/InternalShell";
import StatusBadge from "../../components/StatusBadge";
import { formatBRL, formatDateTime } from "../../lib/format";

const ABAS = [
  { id: "solicitacoes", label: "Solicitações" },
  { id: "visao-geral", label: "Visão geral" },
  { id: "sla", label: "SLA" },
  { id: "arquivos", label: "Arquivos" },
  { id: "configuracoes", label: "Configurações" },
];

export default function PainelADM() {
  const [aba, setAba] = useState("solicitacoes");

  useEffect(() => {
    db.verificarEscalonamentos();
  }, []);

  return (
    <InternalShell>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="font-display text-2xl font-semibold">Painel ADM</h1>
        <p className="mt-1 text-sm text-muted">
          Visão completa do processo — priorize etapas atrasadas e a fila operacional ativa.
        </p>

        <div className="mt-6 flex gap-1 border-b border-line">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                aba === a.id
                  ? "border-ntk text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {aba === "visao-geral" && <VisaoGeral />}
          {aba === "solicitacoes" && <Solicitacoes />}
          {aba === "sla" && <SLA />}
          {aba === "arquivos" && <Arquivos />}
          {aba === "configuracoes" && <Configuracoes />}
        </div>
      </div>
    </InternalShell>
  );
}

// --- Visão geral -----------------------------------------------------------
function VisaoGeral() {
  const solicitacoes = db.listarSolicitacoes();
  const abertas = db.listarTodasLiberacoesAbertas();
  const now = new Date();
  const atrasadas = abertas.filter((l) => new Date(l.prazoEm) < now);

  const porStatus = solicitacoes.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const porSetor = db.ETAPAS_OPERACIONAIS.map((e) => ({
    setor: e.setor,
    etapa: e.nome,
    abertas: abertas.filter((l) => l.etapaId === e.id).length,
  }));

  // Ranking de maiores atrasos (por horas vencidas)
  const rankingAtrasos = [...atrasadas]
    .map((l) => ({
      ...l,
      sol: solicitacoes.find((s) => s.id === l.solicitacaoId),
      cfg: db.configEtapa(l.etapaId),
      horasAtraso: Math.floor((now - new Date(l.prazoEm)) / (1000 * 60 * 60)),
    }))
    .sort((a, b) => b.horasAtraso - a.horasAtraso)
    .slice(0, 5);

  // Maior tempo em fila (aberta há mais tempo, independente de estar atrasada)
  const rankingEspera = [...abertas]
    .map((l) => ({
      ...l,
      sol: solicitacoes.find((s) => s.id === l.solicitacaoId),
      cfg: db.configEtapa(l.etapaId),
      horasEmFila: Math.floor((now - new Date(l.criadoEm)) / (1000 * 60 * 60)),
    }))
    .sort((a, b) => b.horasEmFila - a.horasEmFila)
    .slice(0, 5);

  // Ranking de produtos por quantidade/valor (a partir dos itens de NF lidos)
  const todosItens = solicitacoes.flatMap((s) => {
    const leitura = db.getLeituraNF(s.id);
    return leitura ? db.listarItensNF(leitura.id) : [];
  });
  const porProduto = {};
  todosItens.forEach((i) => {
    const chave = i.descricao || i.codigo || "Item";
    if (!porProduto[chave]) porProduto[chave] = { quantidade: 0, valor: 0 };
    porProduto[chave].quantidade += Number(i.quantidade || 0);
    porProduto[chave].valor += Number(i.valorTotal || 0);
  });
  const rankingProdutos = Object.entries(porProduto)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  const maiorHoras = Math.max(1, ...rankingAtrasos.map((r) => r.horasAtraso), ...rankingEspera.map((r) => r.horasEmFila));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Solicitações totais" value={solicitacoes.length} />
        <Metric label="Etapas abertas" value={abertas.length} />
        <Metric label="Etapas atrasadas" value={atrasadas.length} tone={atrasadas.length ? "bad" : "ok"} />
        <Metric label="Concluídas" value={porStatus.concluido || 0} tone="ok" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Fila por setor
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {porSetor.map((s) => (
            <div key={s.etapa} className="rounded-sm border border-line bg-white px-4 py-3">
              <p className="text-xs text-muted">{s.setor}</p>
              <p className="font-display text-xl font-semibold">{s.abertas}</p>
              <p className="text-xs text-muted">{s.etapa}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Ranking de maiores atrasos
          </h2>
          <div className="space-y-2 rounded-sm border border-line bg-white p-4">
            {rankingAtrasos.map((r) => (
              <RankingBarra
                key={r.id}
                label={`${r.sol?.protocolo} — ${r.cfg?.nome}`}
                valor={r.horasAtraso}
                max={maiorHoras}
                sufixo="h atrasada"
                tone="bad"
              />
            ))}
            {rankingAtrasos.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">Nenhuma etapa atrasada.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Maior tempo em fila
          </h2>
          <div className="space-y-2 rounded-sm border border-line bg-white p-4">
            {rankingEspera.map((r) => (
              <RankingBarra
                key={r.id}
                label={`${r.sol?.protocolo} — ${r.cfg?.nome}`}
                valor={r.horasEmFila}
                max={maiorHoras}
                sufixo="h em fila"
                tone="warn"
              />
            ))}
            {rankingEspera.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">Nenhuma etapa aberta.</p>
            )}
          </div>
        </div>
      </div>

      {rankingProdutos.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Ranking de produtos devolvidos
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2">Produto</th>
                <th className="py-2">Quantidade</th>
                <th className="py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rankingProdutos.map((p) => (
                <tr key={p.nome} className="border-b border-line/60">
                  <td className="py-2">{p.nome}</td>
                  <td className="py-2">{p.quantidade}</td>
                  <td className="py-2">{formatBRL(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankingBarra({ label, valor, max, sufixo, tone }) {
  const pct = Math.min(100, Math.round((valor / max) * 100));
  const barClass = tone === "bad" ? "bg-bad" : "bg-warn";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="truncate pr-2">{label}</span>
        <span className="shrink-0 text-muted">{valor}{sufixo ? ` ${sufixo}` : ""}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// --- Solicitações ------------------------------------------------------------
function Solicitacoes() {
  const [expandido, setExpandido] = useState(null);
  const solicitacoes = db.listarSolicitacoes();

  return (
    <div className="space-y-2">
      {solicitacoes.map((s) => {
        const comp = db.getComplemento(s.id);
        const liberacoes = db.listarLiberacoesPorSolicitacao(s.id);
        const aberto = expandido === s.id;
        return (
          <div key={s.id} className="rounded-sm border border-line bg-white">
            <button
              onClick={() => setExpandido(aberto ? null : s.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div>
                <p className="font-medium">{s.protocolo}</p>
                <p className="text-xs text-muted">{comp?.nomeEmpresa}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted sm:inline">
                  {formatBRL(comp?.valorNota)}
                </span>
                <StatusBadge status={s.status} />
              </div>
            </button>

            {aberto && (
              <div className="border-t border-line px-4 py-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                  <Info label="CNPJ" value={comp?.cnpj} />
                  <Info label="Solicitante" value={comp?.nomeSolicitante} />
                  <Info label="Regional" value={comp?.responsavelRegional} />
                  <Info label="NF de origem" value={comp?.nfOrigem} />
                </dl>
                <p className="mt-2 text-sm text-ink/80">{comp?.descricaoMotivo}</p>

                <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                  Linha do tempo operacional
                </h3>
                {liberacoes.length === 0 && (
                  <p className="text-sm text-muted">Ainda não iniciou o fluxo operacional.</p>
                )}
                <ul className="space-y-1.5">
                  {liberacoes.map((l) => {
                    const cfg = db.configEtapa(l.etapaId);
                    const atrasada = l.status === "aberta" && new Date(l.prazoEm) < new Date();
                    return (
                      <li key={l.id} className="flex items-center justify-between rounded-sm bg-sand px-3 py-2 text-sm">
                        <span>
                          {cfg?.nome} <span className="text-muted">— {l.setor}</span>
                        </span>
                        <span
                          className={
                            l.status === "concluida"
                              ? "text-ok"
                              : atrasada
                              ? "text-bad"
                              : "text-warn"
                          }
                        >
                          {l.status === "concluida"
                            ? `Concluída em ${formatDateTime(l.concluidoEm)}`
                            : atrasada
                            ? `Atrasada — prazo era ${formatDateTime(l.prazoEm)}`
                            : `Prazo: ${formatDateTime(l.prazoEm)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      {solicitacoes.length === 0 && (
        <p className="rounded-sm border border-line bg-white px-4 py-8 text-center text-muted">
          Nenhuma solicitação registrada.
        </p>
      )}
    </div>
  );
}

// --- SLA ---------------------------------------------------------------------
function SLA() {
  const abertas = db.listarTodasLiberacoesAbertas();
  const now = new Date();

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2">Protocolo</th>
            <th className="py-2">Etapa</th>
            <th className="py-2">Setor</th>
            <th className="py-2">Prazo</th>
            <th className="py-2">Situação</th>
          </tr>
        </thead>
        <tbody>
          {abertas.map((l) => {
            const sol = db.listarSolicitacoes().find((s) => s.id === l.solicitacaoId);
            const cfg = db.configEtapa(l.etapaId);
            const atrasada = new Date(l.prazoEm) < now;
            return (
              <tr key={l.id} className="border-b border-line/60">
                <td className="py-2 font-medium">{sol?.protocolo}</td>
                <td className="py-2">{cfg?.nome}</td>
                <td className="py-2">{l.setor}</td>
                <td className="py-2 text-muted">{formatDateTime(l.prazoEm)}</td>
                <td className={`py-2 font-medium ${atrasada ? "text-bad" : "text-ok"}`}>
                  {atrasada ? "Atrasada" : "No prazo"}
                </td>
              </tr>
            );
          })}
          {abertas.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted">
                Nenhuma etapa aberta no momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
        Histórico de escalonamentos
      </h2>
      <ul className="space-y-1.5">
        {db
          .listarLog()
          .filter((l) => l.tipo === "escalonamento")
          .map((l) => (
            <li key={l.id} className="rounded-sm border border-bad/30 bg-badbg px-3 py-2 text-sm text-bad">
              {formatDateTime(l.criadoEm)} — {l.mensagem}
            </li>
          ))}
        {db.listarLog().filter((l) => l.tipo === "escalonamento").length === 0 && (
          <p className="text-sm text-muted">Nenhum escalonamento registrado.</p>
        )}
      </ul>
    </div>
  );
}

// --- Arquivos ------------------------------------------------------------------
function Arquivos() {
  const solicitacoes = db.listarSolicitacoes();
  const comAnexos = solicitacoes
    .map((s) => ({ sol: s, anexos: db.listarAnexos(s.id) }))
    .filter((x) => x.anexos.length > 0);

  return (
    <div className="space-y-3">
      {comAnexos.map(({ sol, anexos }) => (
        <div key={sol.id} className="rounded-sm border border-line bg-white px-4 py-3">
          <p className="font-medium">{sol.protocolo}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {anexos.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.nomeArquivo}</span>
                <span>{formatDateTime(a.criadoEm)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {comAnexos.length === 0 && (
        <p className="rounded-sm border border-line bg-white px-4 py-8 text-center text-muted">
          Nenhum anexo registrado ainda.
        </p>
      )}
    </div>
  );
}

// --- Configurações ---------------------------------------------------------------
function Configuracoes() {
  const [, force] = useState(0);

  function salvarSLA(etapaId, horas) {
    db.setConfigEtapa(etapaId, { slaHorasUteis: Number(horas) });
    force((n) => n + 1);
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        SLA por etapa (horas úteis)
      </h2>
      <div className="space-y-2">
        {db.ETAPAS_OPERACIONAIS.map((e) => {
          const cfg = db.configEtapa(e.id);
          return (
            <div key={e.id} className="flex items-center justify-between rounded-sm border border-line bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium">{e.nome}</p>
                <p className="text-xs text-muted">{e.setor} · {cfg.emails.join(", ")}</p>
              </div>
              <input
                type="number"
                min={1}
                defaultValue={cfg.slaHorasUteis}
                onBlur={(ev) => salvarSLA(e.id, ev.target.value)}
                className="w-20 rounded-sm border border-line px-2 py-1.5 text-right text-sm outline-none focus:border-ntk"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-sm border border-line bg-white px-4 py-4">
        <p className="text-sm font-medium">Área de demonstração</p>
        <p className="mt-1 text-xs text-muted">
          Limpa todos os dados locais simulados (solicitações, aprovações, anexos, log). Use apenas em ambiente de testes.
        </p>
        <button
          onClick={() => {
            if (confirm("Confirma limpar toda a base local de demonstração?")) {
              db.resetarBaseDemo();
              window.location.reload();
            }
          }}
          className="mt-3 rounded-sm border border-bad/40 px-4 py-2 text-sm font-medium text-bad hover:bg-badbg"
        >
          Limpar base de demonstração
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const toneClass = tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-sm border border-line bg-white px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
