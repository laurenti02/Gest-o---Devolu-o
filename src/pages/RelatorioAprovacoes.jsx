import { useMemo, useState } from "react";
import db from "../lib/db";
import InternalShell from "../components/InternalShell";
import StatusBadge from "../components/StatusBadge";
import { formatBRL, formatDateTime, papelLabel } from "../lib/format";

export default function RelatorioAprovacoes() {
  const [mensagem, setMensagem] = useState("");

  const dados = useMemo(() => {
    const solicitacoes = db.listarSolicitacoes();
    const historico = solicitacoes.flatMap((s) =>
      db.listarHistoricoAprovacao(s.id).map((h) => ({ ...h, protocolo: s.protocolo }))
    );

    const totalAnalisadas = solicitacoes.length;
    const aprovadas = solicitacoes.filter((s) =>
      ["aprovado_interno", "aguardando_nfd", "em_operacao", "concluido"].includes(s.status)
    ).length;
    const reprovadas = solicitacoes.filter((s) => s.status === "reprovado").length;
    const pendentes = solicitacoes.filter((s) =>
      ["aguardando_diretoria", "aguardando_gerente", "aguardando_adm"].includes(s.status)
    ).length;
    const valorAprovado = solicitacoes
      .filter((s) =>
        ["aprovado_interno", "aguardando_nfd", "em_operacao", "concluido"].includes(s.status)
      )
      .reduce((acc, s) => acc + Number(db.getComplemento(s.id)?.valorNota || 0), 0);

    return { solicitacoes, historico, totalAnalisadas, aprovadas, reprovadas, pendentes, valorAprovado };
  }, []);

  function exportarCSV() {
    const linhas = [
      ["Protocolo", "Papel", "Usuário", "Decisão", "Comentário", "Data"],
      ...dados.historico.map((h) => [
        h.protocolo,
        papelLabel(h.papel),
        h.usuario,
        h.decisao,
        (h.comentario || "").replace(/\n/g, " "),
        formatDateTime(h.criadoEm),
      ]),
    ];
    const csv = linhas.map((l) => l.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-aprovacoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function salvarSnapshot() {
    db.registrarLog({
      tipo: "snapshot_relatorio",
      solicitacaoId: null,
      mensagem: `Snapshot do relatório salvo: ${dados.totalAnalisadas} analisadas, ${dados.aprovadas} aprovadas, ${dados.reprovadas} reprovadas, ${dados.pendentes} pendentes.`,
    });
    setMensagem("Snapshot registrado no log operacional.");
    setTimeout(() => setMensagem(""), 3000);
  }

  return (
    <InternalShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold">Relatório de aprovações</h1>
          <div className="flex gap-2">
            <button
              onClick={salvarSnapshot}
              className="rounded-sm border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-sand"
            >
              Salvar snapshot
            </button>
            <button
              onClick={exportarCSV}
              className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              Exportar CSV
            </button>
          </div>
        </div>
        {mensagem && <p className="mt-2 text-sm text-ok">{mensagem}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric label="Analisadas" value={dados.totalAnalisadas} />
          <Metric label="Aprovadas" value={dados.aprovadas} tone="ok" />
          <Metric label="Rejeitadas" value={dados.reprovadas} tone="bad" />
          <Metric label="Pendentes" value={dados.pendentes} tone="warn" />
          <Metric label="Valor aprovado" value={formatBRL(dados.valorAprovado)} />
        </div>

        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
          Histórico de decisões
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2">Protocolo</th>
              <th className="py-2">Papel</th>
              <th className="py-2">Usuário</th>
              <th className="py-2">Decisão</th>
              <th className="py-2">Comentário</th>
              <th className="py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {dados.historico.map((h) => (
              <tr key={h.id} className="border-b border-line/60 align-top">
                <td className="py-2 font-medium">{h.protocolo}</td>
                <td className="py-2">{papelLabel(h.papel)}</td>
                <td className="py-2 text-muted">{h.usuario}</td>
                <td className="py-2">
                  <span className={h.decisao === "aprovado" ? "text-ok" : "text-bad"}>
                    {h.decisao}
                  </span>
                </td>
                <td className="max-w-xs py-2 text-muted">{h.comentario || "—"}</td>
                <td className="py-2 text-muted">{formatDateTime(h.criadoEm)}</td>
              </tr>
            ))}
            {dados.historico.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  Nenhuma decisão registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
          Decisões por protocolo
        </h2>
        <div className="space-y-2">
          {dados.solicitacoes.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-sm border border-line bg-white px-4 py-2.5">
              <span className="font-medium">{s.protocolo}</span>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>
    </InternalShell>
  );
}

function Metric({ label, value, tone }) {
  const toneClass =
    tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="rounded-sm border border-line bg-white px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
