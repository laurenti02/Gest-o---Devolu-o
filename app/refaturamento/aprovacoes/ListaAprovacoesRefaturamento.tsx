"use client";

import { useState } from "react";

type Solicitacao = {
  id: number;
  protocolo: string;
  clienteOriginal: string;
  cnpjOriginal: string;
  solicitante: string;
  setorSolicitante: string;
  notaFiscalOriginal: string;
  valor: number;
  mercadoriaSaiu: string;
  motivo: string;
  criadoEm: string;
};

export function ListaAprovacoesRefaturamento({ solicitacoesIniciais }: { solicitacoesIniciais: Solicitacao[] }) {
  const [lista, setLista] = useState(solicitacoesIniciais);
  const [processando, setProcessando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<Record<number, string>>({});

  async function decidir(id: number, decisao: "aprovado" | "reprovado") {
    setProcessando(id);
    try {
      const resp = await fetch("/api/refaturamento/decisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decisao }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setMensagem((m) => ({ ...m, [id]: json.erro }));
        return;
      }
      setLista((l) => l.filter((s) => s.id !== id));
    } finally {
      setProcessando(null);
    }
  }

  if (lista.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhuma solicitação pendente no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.map((s) => (
        <div key={s.id} className="ntk-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-bold">{s.protocolo}</span>
            <span className="font-display font-bold">
              {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <dl className="text-sm grid grid-cols-2 gap-y-1 mb-3">
            <dt className="text-neutral-500">Cliente</dt>
            <dd className="text-right">{s.clienteOriginal}</dd>
            <dt className="text-neutral-500">CNPJ</dt>
            <dd className="text-right">{s.cnpjOriginal}</dd>
            <dt className="text-neutral-500">Solicitante</dt>
            <dd className="text-right">{s.solicitante} · {s.setorSolicitante}</dd>
            <dt className="text-neutral-500">NF original</dt>
            <dd className="text-right">{s.notaFiscalOriginal}</dd>
            <dt className="text-neutral-500">Mercadoria saiu?</dt>
            <dd className="text-right">{s.mercadoriaSaiu === "sim" ? "Sim" : "Não"}</dd>
          </dl>
          <p className="text-sm text-neutral-700 border-t pt-2 mb-3" style={{ borderColor: "var(--ntk-borda)" }}>
            {s.motivo}
          </p>

          {mensagem[s.id] && (
            <p className="text-xs mb-2" style={{ color: "var(--ntk-vermelho)" }}>{mensagem[s.id]}</p>
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
        </div>
      ))}
    </div>
  );
}
