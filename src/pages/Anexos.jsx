import { useState } from "react";
import db from "../lib/db";
import InternalShell from "../components/InternalShell";
import { formatBRL, formatDateTime } from "../lib/format";

export default function Anexos() {
  const [selecionada, setSelecionada] = useState(null);
  const solicitacoes = db.listarSolicitacoes();

  return (
    <InternalShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="font-display text-2xl font-semibold">Anexos</h1>
        <p className="mt-1 text-sm text-muted">
          Evidências, aprovações e leitura inteligente da NF de devolução.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-2">
            {solicitacoes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelecionada(s.id)}
                className={`block w-full rounded-sm border px-3 py-2.5 text-left text-sm ${
                  selecionada === s.id
                    ? "border-ntk bg-white font-medium"
                    : "border-line bg-white text-muted hover:text-ink"
                }`}
              >
                {s.protocolo}
              </button>
            ))}
          </div>

          <div className="col-span-2">
            {!selecionada && (
              <p className="rounded-sm border border-line bg-white px-4 py-8 text-center text-muted">
                Selecione uma solicitação para ver os anexos.
              </p>
            )}
            {selecionada && <DetalheAnexos solicitacaoId={selecionada} />}
          </div>
        </div>
      </div>
    </InternalShell>
  );
}

function DetalheAnexos({ solicitacaoId }) {
  const anexos = db.listarAnexos(solicitacaoId);
  const leitura = db.getLeituraNF(solicitacaoId);
  const itens = leitura ? db.listarItensNF(leitura.id) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-line bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Arquivos</h2>
        {anexos.length === 0 && <p className="mt-2 text-sm text-muted">Nenhum arquivo anexado.</p>}
        <ul className="mt-2 space-y-1.5">
          {anexos.map((a) => (
            <li key={a.id} className="flex justify-between text-sm">
              <span>{a.nomeArquivo} <span className="text-xs text-muted">({a.tipo})</span></span>
              <span className="text-muted">{formatDateTime(a.criadoEm)}</span>
            </li>
          ))}
        </ul>
      </div>

      {leitura && (
        <div className="rounded-sm border border-line bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Leitura inteligente da NF
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Número da nota</dt>
              <dd className="font-medium">{leitura.numeroNota}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Cliente</dt>
              <dd className="font-medium">{leitura.cliente}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Valor total</dt>
              <dd className="font-medium">{formatBRL(leitura.valorTotal)}</dd>
            </div>
          </dl>

          {leitura.inconsistencias?.length > 0 && (
            <div className="mt-3 rounded-sm border border-bad/30 bg-badbg px-3 py-2 text-sm text-bad">
              {leitura.inconsistencias.join(" · ")}
            </div>
          )}

          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-1.5">Código</th>
                <th className="py-1.5">Descrição</th>
                <th className="py-1.5">Qtd.</th>
                <th className="py-1.5">Unitário</th>
                <th className="py-1.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id} className="border-b border-line/60">
                  <td className="py-1.5">{i.codigo}</td>
                  <td className="py-1.5">{i.descricao}</td>
                  <td className="py-1.5">{i.quantidade}</td>
                  <td className="py-1.5">{formatBRL(i.valorUnitario)}</td>
                  <td className="py-1.5">{formatBRL(i.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
