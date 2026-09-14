"use client";

import { useState } from "react";
import { SETOR_LABEL } from "@/lib/fluxo";

type Etapa = {
  id: number;
  setor: string;
  status: string;
  responsavel: string | null;
  comentario: string | null;
  prazoLimite: string | null;
  atrasado: boolean;
  solicitacao: { protocolo: string; empresa: string; valor: number } | undefined;
};

const COLUNAS = [
  { status: "pendente", label: "Pendente" },
  { status: "em_andamento", label: "Em andamento" },
  { status: "concluido", label: "Concluído" },
];

export function PainelSetorCliente({ etapasIniciais }: { etapasIniciais: Etapa[] }) {
  const [etapas, setEtapas] = useState(etapasIniciais);
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [processando, setProcessando] = useState<number | null>(null);

  async function atualizar(etapaId: number, status: string) {
    setProcessando(etapaId);
    try {
      const resp = await fetch("/api/etapas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapaId, status, comentario: comentarios[etapaId] || "" }),
      });
      if (resp.ok) {
        setEtapas((lista) => lista.map((e) => (e.id === etapaId ? { ...e, status } : e)));
      }
    } finally {
      setProcessando(null);
    }
  }

  if (etapas.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhuma etapa neste painel no momento.</p>;
  }

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {COLUNAS.map((coluna) => (
        <div key={coluna.status}>
          <div className="font-mono text-xs uppercase tracking-wide text-neutral-500 mb-2">
            {coluna.label} ({etapas.filter((e) => e.status === coluna.status).length})
          </div>
          <div className="flex flex-col gap-3">
            {etapas
              .filter((e) => e.status === coluna.status)
              .map((e) => (
                <div key={e.id} className="ntk-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold">{e.solicitacao?.protocolo}</span>
                    {e.atrasado && (
                      <span className="ntk-tag" style={{ color: "var(--ntk-vermelho)" }}>
                        Atrasado
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{e.solicitacao?.empresa}</p>
                  <p className="text-xs text-neutral-500 mb-2">{SETOR_LABEL[e.setor] ?? e.setor}</p>

                  {coluna.status !== "concluido" && (
                    <>
                      <textarea
                        className="ntk-input text-xs mb-2"
                        placeholder="Comentário"
                        value={comentarios[e.id] || ""}
                        onChange={(ev) => setComentarios((c) => ({ ...c, [e.id]: ev.target.value }))}
                      />
                      <div className="flex gap-2">
                        {coluna.status === "pendente" && (
                          <button
                            disabled={processando === e.id}
                            onClick={() => atualizar(e.id, "em_andamento")}
                            className="ntk-btn-outline px-3 py-1.5 text-xs"
                          >
                            Iniciar
                          </button>
                        )}
                        <button
                          disabled={processando === e.id}
                          onClick={() => atualizar(e.id, "concluido")}
                          className="ntk-btn-primary px-3 py-1.5 text-xs"
                        >
                          Concluir e liberar próxima etapa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
