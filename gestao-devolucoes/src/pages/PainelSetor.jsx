import { useState } from "react";
import db from "../lib/db";
import { useAuth } from "../lib/auth";
import InternalShell from "../components/InternalShell";
import { formatBRL, formatDateTime } from "../lib/format";

export default function PainelSetor() {
  const { usuario } = useAuth();
  const [, force] = useState(0);
  const [comentarios, setComentarios] = useState({});
  const [expandidoId, setExpandidoId] = useState(null);

  const abertas = db.listarLiberacoesAbertasPorSetor(usuario.setor);
  const now = new Date();

  const emDia = abertas
    .filter((l) => new Date(l.prazoEm) >= now)
    .sort((a, b) => new Date(a.prazoEm) - new Date(b.prazoEm));
  const atrasadas = abertas
    .filter((l) => new Date(l.prazoEm) < now)
    .sort((a, b) => new Date(a.prazoEm) - new Date(b.prazoEm));

  const concluidas = db.ETAPAS_OPERACIONAIS.filter((e) => e.setor === usuario.setor)
    .flatMap((e) =>
      db
        .listarLog()
        .filter((l) => l.tipo === "etapa" && l.mensagem.includes(e.nome) && l.mensagem.includes("concluída"))
    )
    .slice(0, 8);

  const maiorEspera = [...abertas].sort(
    (a, b) => new Date(a.criadoEm) - new Date(b.criadoEm)
  )[0];

  function concluir(lib) {
    db.concluirEtapa(lib.id, {
      usuario: usuario.email,
      comentario: comentarios[lib.id] || "",
      resultado: "ok",
    });
    setExpandidoId(null);
    force((n) => n + 1);
  }

  return (
    <InternalShell>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="font-display text-2xl font-semibold">Painel do setor</h1>
        <p className="mt-1 text-sm text-muted">
          {usuario.setor} — pendências liberadas para o seu time
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Pendentes" value={abertas.length} />
          <Metric label="No prazo" value={emDia.length} tone="ok" />
          <Metric label="Atrasadas" value={atrasadas.length} tone={atrasadas.length ? "bad" : "ok"} />
          <Metric
            label="Maior tempo em fila"
            value={maiorEspera ? tempoDecorrido(maiorEspera.criadoEm) : "—"}
          />
        </div>

        <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
          Kanban do setor
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <KanbanColuna titulo="No prazo" tone="ok" total={emDia.length}>
            {emDia.map((lib) => (
              <CardEtapa
                key={lib.id}
                lib={lib}
                atrasada={false}
                expandido={expandidoId === lib.id}
                onToggle={() => setExpandidoId(expandidoId === lib.id ? null : lib.id)}
                comentario={comentarios[lib.id] || ""}
                onComentario={(v) => setComentarios((c) => ({ ...c, [lib.id]: v }))}
                onConcluir={() => concluir(lib)}
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
                comentario={comentarios[lib.id] || ""}
                onComentario={(v) => setComentarios((c) => ({ ...c, [lib.id]: v }))}
                onConcluir={() => concluir(lib)}
              />
            ))}
            {atrasadas.length === 0 && <ColunaVazia texto="Nenhuma etapa atrasada." />}
          </KanbanColuna>

          <KanbanColuna titulo="Concluídas recentemente" tone="muted" total={concluidas.length}>
            {concluidas.map((l) => (
              <div key={l.id} className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm">
                <p className="text-ink/80">{l.mensagem}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(l.criadoEm)}</p>
              </div>
            ))}
            {concluidas.length === 0 && <ColunaVazia texto="Ainda sem etapas concluídas." />}
          </KanbanColuna>
        </div>
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

function CardEtapa({ lib, atrasada, expandido, onToggle, comentario, onComentario, onConcluir }) {
  const sol = db.listarSolicitacoes().find((s) => s.id === lib.solicitacaoId);
  const comp = db.getComplemento(lib.solicitacaoId);
  const cfg = db.configEtapa(lib.etapaId);

  return (
    <div className={`rounded-sm border bg-white p-3 ${atrasada ? "border-bad/30" : "border-line"}`}>
      <button onClick={onToggle} className="block w-full text-left">
        <p className="font-display text-sm font-semibold">{sol?.protocolo}</p>
        <p className="text-xs text-muted">{comp?.nomeEmpresa} · {formatBRL(comp?.valorNota)}</p>
        <p className="mt-1 text-xs">{cfg?.nome}</p>
        <p className={`mt-1 text-xs font-medium ${atrasada ? "text-bad" : "text-warn"}`}>
          {atrasada ? "Venceu" : "Prazo"}: {formatDateTime(lib.prazoEm)}
        </p>
      </button>

      {expandido && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <textarea
            value={comentario}
            onChange={(e) => onComentario(e.target.value)}
            placeholder="Comentário livre sobre a etapa"
            className="w-full rounded-sm border border-line px-2.5 py-2 text-xs outline-none focus:border-ntk"
          />
          <button
            onClick={onConcluir}
            className="w-full rounded-sm bg-ntk px-3 py-2 text-xs font-semibold text-ink hover:bg-ntk-dark hover:text-white"
          >
            Liberar próxima etapa
          </button>
        </div>
      )}
    </div>
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
