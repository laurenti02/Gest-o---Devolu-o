import { useState, useMemo } from "react";
import db from "../lib/db";
import { useAuth } from "../lib/auth";
import InternalShell from "../components/InternalShell";
import StatusBadge from "../components/StatusBadge";
import { formatBRL, formatDateTime, papelLabel } from "../lib/format";

const STATUS_POR_PAPEL = {
  diretoria: "aguardando_diretoria",
  gerente: "aguardando_gerente",
  adm: "aguardando_adm",
};

export default function Aprovacoes() {
  const { usuario } = useAuth();
  const [, force] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [comentario, setComentario] = useState("");

  const papel = usuario.perfil; // diretoria | gerente | adm
  const statusRelevante = STATUS_POR_PAPEL[papel];

  const solicitacoes = useMemo(() => {
    return db
      .listarSolicitacoes()
      .filter((s) => (papel === "adm" ? true : s.status === statusRelevante));
  }, [papel, statusRelevante]);

  const pendentes = solicitacoes.filter((s) => s.status === statusRelevante);
  const outras = solicitacoes.filter((s) => s.status !== statusRelevante);

  function decidir(sol, decisao) {
    db.registrarAprovacao(sol.id, {
      papel,
      usuario: usuario.email,
      decisao,
      comentario,
    });
    setComentario("");
    setSelecionada(null);
    force((n) => n + 1);
  }

  return (
    <InternalShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="font-display text-2xl font-semibold">Aprovações</h1>
        <p className="mt-1 text-sm text-muted">
          Fila de aprovação — perfil ativo: {usuario.nome} ({papelLabel(papel)})
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Pendentes ({pendentes.length})
          </h2>
          {pendentes.length === 0 && (
            <p className="rounded-sm border border-line bg-white px-4 py-6 text-center text-sm text-muted">
              Nenhuma solicitação pendente para o seu perfil.
            </p>
          )}
          <div className="space-y-3">
            {pendentes.map((sol) => {
              const comp = db.getComplemento(sol.id);
              return (
                <div key={sol.id} className="rounded-sm border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{sol.protocolo}</p>
                      <p className="text-sm text-muted">
                        {comp?.nomeEmpresa} · {comp?.cnpj}
                      </p>
                    </div>
                    <StatusBadge status={sol.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                    <Info label="Solicitante" value={comp?.nomeSolicitante} />
                    <Info label="Regional" value={comp?.responsavelRegional} />
                    <Info label="NF de origem" value={comp?.nfOrigem} />
                    <Info label="Valor" value={formatBRL(comp?.valorNota)} />
                  </dl>
                  <p className="mt-3 text-sm text-ink/80">{comp?.descricaoMotivo}</p>

                  {selecionada === sol.id ? (
                    <div className="mt-4 space-y-2 border-t border-line pt-3">
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Comentário (obrigatório em caso de reprovação)"
                        className="w-full rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-ntk"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => decidir(sol, "aprovado")}
                          className="rounded-sm bg-ok px-4 py-2 text-sm font-medium text-white hover:bg-ok/90"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            if (!comentario.trim()) return;
                            decidir(sol, "reprovado");
                          }}
                          className="rounded-sm bg-bad px-4 py-2 text-sm font-medium text-white hover:bg-bad/90"
                        >
                          Reprovar
                        </button>
                        <button
                          onClick={() => setSelecionada(null)}
                          className="rounded-sm px-4 py-2 text-sm text-muted hover:bg-sand"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelecionada(sol.id)}
                      className="mt-3 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
                    >
                      Analisar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {papel === "adm" && outras.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Demais solicitações
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Protocolo</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {outras.map((s) => (
                  <tr key={s.id} className="border-b border-line/60">
                    <td className="py-2 font-medium">{s.protocolo}</td>
                    <td className="py-2">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-2 text-muted">{formatDateTime(s.atualizadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </InternalShell>
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
