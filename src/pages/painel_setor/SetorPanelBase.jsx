import { useState } from "react";
import db from "../../lib/db";
import { useAuth } from "../../lib/auth";
import InternalShell from "../../components/InternalShell";
import { formatBRL, formatDateTime } from "../../lib/format";

// ---------------------------------------------------------------------------
// Base compartilhada pelos painéis de setor. Cada setor (Validação NFD,
// Transportes, Recebimento, Financeiro) usa este componente com um conjunto
// diferente de "camposConclusao", produzindo uma tela com identidade e
// formulário próprios, mas reaproveitando a lógica de Kanban/Histórico/SLA.
// ---------------------------------------------------------------------------

export default function SetorPanelBase({ setor, titulo, subtitulo, icone, camposConclusao }) {
  const { usuario } = useAuth();
  const [, force] = useState(0);
  const [valoresForm, setValoresForm] = useState({}); // { [libId]: { [campoId]: valor } }
  const [expandidoId, setExpandidoId] = useState(null);
  const [vista, setVista] = useState("kanban");
  const [filtroHistorico, setFiltroHistorico] = useState("");

  const abertas = db.listarLiberacoesAbertasPorSetor(setor);
  const todas = db.listarLiberacoesPorSetorTodas(setor);
  const now = new Date();

  const emDia = abertas
    .filter((l) => new Date(l.prazoEm) >= now)
    .sort((a, b) => new Date(a.prazoEm) - new Date(b.prazoEm));
  const atrasadas = abertas
    .filter((l) => new Date(l.prazoEm) < now)
    .sort((a, b) => new Date(a.prazoEm) - new Date(b.prazoEm));

  const totalConcluidas = todas.filter((l) => l.status === "concluida").length;
  const totalAtrasadasHist = todas.filter(
    (l) => l.status === "concluida" && l.concluidoEm && new Date(l.concluidoEm) > new Date(l.prazoEm)
  ).length;

  const maiorEspera = [...abertas].sort(
    (a, b) => new Date(a.criadoEm) - new Date(b.criadoEm)
  )[0];

  const historicoFiltrado = todas.filter((l) => {
    if (!filtroHistorico.trim()) return true;
    const sol = db.listarSolicitacoes().find((s) => s.id === l.solicitacaoId);
    const comp = db.getComplemento(l.solicitacaoId);
    const alvo = `${sol?.protocolo || ""} ${comp?.nomeEmpresa || ""}`.toLowerCase();
    return alvo.includes(filtroHistorico.toLowerCase());
  });

  function setCampo(libId, campoId, valor) {
    setValoresForm((v) => ({
      ...v,
      [libId]: { ...(v[libId] || {}), [campoId]: valor },
    }));
  }

  function formularioCompleto(libId) {
    const valores = valoresForm[libId] || {};
    return camposConclusao.every((c) => !c.obrigatorio || String(valores[c.id] || "").trim());
  }

  function montarComentario(libId) {
    const valores = valoresForm[libId] || {};
    const partes = camposConclusao
      .filter((c) => c.id !== "observacao")
      .map((c) => `${c.label}: ${valores[c.id] || "—"}`);
    const obs = valores.observacao ? ` — ${valores.observacao}` : "";
    return partes.join(" · ") + obs;
  }

  function concluir(lib) {
    if (!formularioCompleto(lib.id)) return;
    db.concluirEtapa(lib.id, {
      usuario: usuario.email,
      comentario: montarComentario(lib.id),
      resultado: "ok",
    });
    setExpandidoId(null);
    force((n) => n + 1);
  }

  return (
    <InternalShell>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-ink font-display text-lg font-bold text-ntk">
            {icone}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
            <p className="text-sm text-muted">{subtitulo}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric label="Pendentes" value={abertas.length} />
          <Metric label="No prazo" value={emDia.length} tone="ok" />
          <Metric label="Atrasadas" value={atrasadas.length} tone={atrasadas.length ? "bad" : "ok"} />
          <Metric label="Concluídas (total)" value={totalConcluidas} tone="ok" />
          <Metric
            label="Maior tempo em fila"
            value={maiorEspera ? tempoDecorrido(maiorEspera.criadoEm) : "—"}
          />
        </div>

        <div className="mt-6 flex gap-1 border-b border-line">
          <button
            onClick={() => setVista("kanban")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              vista === "kanban" ? "border-ntk text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setVista("historico")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              vista === "historico" ? "border-ntk text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Histórico completo ({todas.length})
          </button>
        </div>

        {vista === "kanban" && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <KanbanColuna titulo="No prazo" tone="ok" total={emDia.length}>
              {emDia.map((lib) => (
                <CardEtapa
                  key={lib.id}
                  lib={lib}
                  atrasada={false}
                  expandido={expandidoId === lib.id}
                  onToggle={() => setExpandidoId(expandidoId === lib.id ? null : lib.id)}
                  camposConclusao={camposConclusao}
                  valores={valoresForm[lib.id] || {}}
                  onCampo={(campoId, valor) => setCampo(lib.id, campoId, valor)}
                  onConcluir={() => concluir(lib)}
                  podeConcluir={formularioCompleto(lib.id)}
                />
              ))}
              {emDia.length === 0 && <ColunaVazia texto="Nada no prazo aguardando." />}
            </KanbanColuna>

            <KanbanColuna titulo="Atrasadas" tone="bad" total={atrasadas.length}>
              {atrasadas.map((lib) => (
                <CardEtapa
                  key={lib.id}
                  lib={lib}
                  atrasada
                  expandido={expandidoId === lib.id}
                  onToggle={() => setExpandidoId(expandidoId === lib.id ? null : lib.id)}
                  camposConclusao={camposConclusao}
                  valores={valoresForm[lib.id] || {}}
                  onCampo={(campoId, valor) => setCampo(lib.id, campoId, valor)}
                  onConcluir={() => concluir(lib)}
                  podeConcluir={formularioCompleto(lib.id)}
                />
              ))}
              {atrasadas.length === 0 && <ColunaVazia texto="Nenhuma etapa atrasada." />}
            </KanbanColuna>
          </div>
        )}

        {vista === "historico" && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <input
                value={filtroHistorico}
                onChange={(e) => setFiltroHistorico(e.target.value)}
                placeholder="Buscar por protocolo ou empresa"
                className="w-full max-w-xs rounded-sm border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ntk"
              />
              <span className="text-xs text-muted">
                {totalAtrasadasHist} de {totalConcluidas} concluídas fora do prazo
              </span>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Protocolo</th>
                  <th className="py-2">Empresa</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Prazo</th>
                  <th className="py-2">Concluída em</th>
                  <th className="py-2">Responsável</th>
                  <th className="py-2">Registro</th>
                </tr>
              </thead>
              <tbody>
                {historicoFiltrado.map((l) => {
                  const sol = db.listarSolicitacoes().find((s) => s.id === l.solicitacaoId);
                  const comp = db.getComplemento(l.solicitacaoId);
                  const atrasouNaConclusao =
                    l.status === "concluida" && l.concluidoEm && new Date(l.concluidoEm) > new Date(l.prazoEm);
                  const atrasadaAberta = l.status === "aberta" && new Date(l.prazoEm) < now;

                  return (
                    <tr key={l.id} className="border-b border-line/60 align-top">
                      <td className="py-2 font-medium">{sol?.protocolo}</td>
                      <td className="py-2 text-muted">{comp?.nomeEmpresa}</td>
                      <td className="py-2">
                        {l.status === "concluida" ? (
                          <span className={atrasouNaConclusao ? "text-warn" : "text-ok"}>
                            {atrasouNaConclusao ? "Concluída com atraso" : "Concluída no prazo"}
                          </span>
                        ) : (
                          <span className={atrasadaAberta ? "text-bad" : "text-warn"}>
                            {atrasadaAberta ? "Aberta — atrasada" : "Aberta"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-muted">{formatDateTime(l.prazoEm)}</td>
                      <td className="py-2 text-muted">{formatDateTime(l.concluidoEm)}</td>
                      <td className="py-2 text-muted">{l.concluidoPor || "—"}</td>
                      <td className="max-w-xs py-2 text-muted">{l.comentario || "—"}</td>
                    </tr>
                  );
                })}
                {historicoFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted">
                      Nenhum registro encontrado para este setor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InternalShell>
  );
}

function KanbanColuna({ titulo, tone, total, children }) {
  const dot = tone === "ok" ? "bg-ok" : tone === "bad" ? "bg-bad" : "bg-muted";
  return (
    <div className="rounded-sm border border-line bg-sand/60 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <h3 className="text-sm font-semibold">{titulo}</h3>
        </div>
        <span className="text-xs text-muted">{total}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ColunaVazia({ texto }) {
  return (
    <p className="rounded-sm border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
      {texto}
    </p>
  );
}

function CardEtapa({ lib, atrasada, expandido, onToggle, camposConclusao, valores, onCampo, onConcluir, podeConcluir }) {
  const sol = db.listarSolicitacoes().find((s) => s.id === lib.solicitacaoId);
  const comp = db.getComplemento(lib.solicitacaoId);

  return (
    <div className={`rounded-sm border bg-white p-3 ${atrasada ? "border-bad/30" : "border-line"}`}>
      <button onClick={onToggle} className="block w-full text-left">
        <p className="font-display text-sm font-semibold">{sol?.protocolo}</p>
        <p className="text-xs text-muted">{comp?.nomeEmpresa} · {formatBRL(comp?.valorNota)}</p>
        <p className={`mt-1 text-xs font-medium ${atrasada ? "text-bad" : "text-warn"}`}>
          {atrasada ? "Venceu" : "Prazo"}: {formatDateTime(lib.prazoEm)}
        </p>
      </button>

      {expandido && (
        <div className="mt-3 space-y-2.5 border-t border-line pt-3">
          {camposConclusao.map((campo) => (
            <CampoConclusao
              key={campo.id}
              campo={campo}
              valor={valores[campo.id] || ""}
              onChange={(v) => onCampo(campo.id, v)}
            />
          ))}
          <button
            onClick={onConcluir}
            disabled={!podeConcluir}
            className="w-full rounded-sm bg-ntk px-3 py-2 text-xs font-semibold text-ink hover:bg-ntk-dark hover:text-white disabled:opacity-40"
          >
            Liberar próxima etapa
          </button>
        </div>
      )}
    </div>
  );
}

function CampoConclusao({ campo, valor, onChange }) {
  const label = (
    <span className="mb-1 block text-xs font-medium text-muted">
      {campo.label}
      {campo.obrigatorio && <span className="text-bad"> *</span>}
    </span>
  );

  if (campo.tipo === "select") {
    return (
      <label className="block">
        {label}
        <select
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-line bg-white px-2.5 py-2 text-xs outline-none focus:border-ntk"
        >
          <option value="">Selecione</option>
          {campo.opcoes.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (campo.tipo === "textarea") {
    return (
      <label className="block">
        {label}
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          className="w-full rounded-sm border border-line px-2.5 py-2 text-xs outline-none focus:border-ntk"
        />
      </label>
    );
  }

  return (
    <label className="block">
      {label}
      <input
        type={campo.tipo || "text"}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        className="w-full rounded-sm border border-line px-2.5 py-2 text-xs outline-none focus:border-ntk"
      />
    </label>
  );
}

function tempoDecorrido(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const horas = Math.floor(ms / (1000 * 60 * 60));
  if (horas < 24) return `${horas}h`;
  return `${Math.floor(horas / 24)}d ${horas % 24}h`;
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
