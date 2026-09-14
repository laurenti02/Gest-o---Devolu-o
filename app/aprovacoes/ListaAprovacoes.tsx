"use client";

import { useState } from "react";

type Decisao = { aprovadorEmail: string; aprovadorNome: string; decisao: string; comentario: string | null };
type Solicitacao = {
  id: number;
  protocolo: string;
  empresa: string;
  cnpj: string;
  nomeSolicitante: string;
  responsavelRegional: string;
  nfOrigem: string;
  valor: number;
  motivo: string;
  criadoEm: string;
  decisoes: Decisao[];
};

export function ListaAprovacoes({
  solicitacoesIniciais,
  emailUsuario,
}: {
  solicitacoesIniciais: Solicitacao[];
  emailUsuario: string;
}) {
  const [lista, setLista] = useState(solicitacoesIniciais);
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [processando, setProcessando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<Record<number, string>>({});

  async function decidir(id: number, decisao: "aprovado" | "reprovado") {
    setProcessando(id);
    try {
      const resp = await fetch("/api/aprovacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitacaoId: id, decisao, comentario: comentarios[id] || "" }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setMensagem((m) => ({ ...m, [id]: json.erro }));
        return;
      }
      if (json.statusFinal !== "aguardando_aprovacao") {
        setLista((l) => l.filter((s) => s.id !== id));
      } else {
        setLista((l) =>
          l.map((s) =>
            s.id === id
              ? { ...s, decisoes: [...s.decisoes, { aprovadorEmail: emailUsuario, aprovadorNome: "Você", decisao, comentario: comentarios[id] || null }] }
              : s
          )
        );
      }
    } finally {
      setProcessando(null);
    }
  }

  if (lista.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhuma solicitação pendente no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.map((s) => {
        const jaVotou = s.decisoes.some((d) => d.aprovadorEmail === emailUsuario);
        return (
          <div key={s.id} className="ntk-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm font-bold">{s.protocolo}</span>
              <span className="font-display font-bold">
                {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <dl className="text-sm grid grid-cols-2 gap-y-1 mb-3">
              <dt className="text-neutral-500">Empresa</dt>
              <dd className="text-right">{s.empresa}</dd>
              <dt className="text-neutral-500">CNPJ</dt>
              <dd className="text-right">{s.cnpj}</dd>
              <dt className="text-neutral-500">Solicitante</dt>
              <dd className="text-right">{s.nomeSolicitante}</dd>
              <dt className="text-neutral-500">Regional</dt>
              <dd className="text-right">{s.responsavelRegional}</dd>
              <dt className="text-neutral-500">NF de origem</dt>
              <dd className="text-right">{s.nfOrigem}</dd>
            </dl>
            <p className="text-sm text-neutral-700 border-t pt-2 mb-3" style={{ borderColor: "var(--ntk-borda)" }}>
              {s.motivo}
            </p>

            {s.decisoes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {s.decisoes.map((d, i) => (
                  <span
                    key={i}
                    className="ntk-tag"
                    style={{ color: d.decisao === "aprovado" ? "var(--ntk-verde)" : "var(--ntk-vermelho)" }}
                  >
                    {d.aprovadorNome}: {d.decisao}
                  </span>
                ))}
              </div>
            )}

            {jaVotou ? (
              <p className="text-xs text-neutral-500">Aguardando a outra aprovação obrigatória.</p>
            ) : (
              <>
                <textarea
                  className="ntk-input text-sm mb-2"
                  placeholder="Comentário (opcional)"
                  value={comentarios[s.id] || ""}
                  onChange={(e) => setComentarios((c) => ({ ...c, [s.id]: e.target.value }))}
                />
                {mensagem[s.id] && (
                  <p className="text-xs mb-2" style={{ color: "var(--ntk-vermelho)" }}>
                    {mensagem[s.id]}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={processando === s.id}
                    onClick={() => decidir(s.id, "aprovado")}
                    className="ntk-btn-primary px-4 py-2 text-sm"
                  >
                    Aprovar
                  </button>
                  <button
                    disabled={processando === s.id}
                    onClick={() => decidir(s.id, "reprovado")}
                    className="ntk-btn-outline px-4 py-2 text-sm"
                    style={{ borderColor: "var(--ntk-vermelho)", color: "var(--ntk-vermelho)" }}
                  >
                    Reprovar
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
