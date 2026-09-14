"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarcaNTK } from "@/components/MarcaNTK";

type StatusPublico = {
  protocolo: string;
  clienteOriginal: string;
  valor: number;
  status: string;
  statusLabel: string;
  etapaAtual: string | null;
  etapaLabel: string | null;
  criadoEm: string;
};

const ETAPAS_ORDEM = ["logistica", "fiscal", "financeiro", "concluido"];

export default function StatusProtocoloRefaturamento() {
  const params = useParams<{ protocolo: string }>();
  const [dados, setDados] = useState<StatusPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/refaturamento/${params.protocolo}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro || "Não encontrado.");
        setDados(j);
      })
      .catch((e) => setErro(e.message));
  }, [params.protocolo]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10" style={{ background: "var(--ntk-osso)" }}>
      <div className="ntk-card p-8 max-w-lg w-full">
        <MarcaNTK subtitulo="Refaturamento" />
        {erro && (
          <div className="mt-6 text-sm px-3 py-2 rounded" style={{ background: "#fbe9e5", color: "var(--ntk-vermelho)" }}>
            {erro}
          </div>
        )}
        {dados && (
          <>
            <div className="mt-6 mb-1 font-mono text-sm text-neutral-500">{dados.protocolo}</div>
            <h1 className="font-display text-2xl font-bold mb-4">{dados.clienteOriginal}</h1>

            <div className="flex items-center gap-2 mb-5">
              <span className="ntk-tag" style={{ color: dados.status === "reprovado" ? "var(--ntk-vermelho)" : "var(--ntk-laranja-forte)" }}>
                {dados.statusLabel}
              </span>
              {dados.etapaLabel && <span className="ntk-tag" style={{ color: "var(--ntk-preto)" }}>{dados.etapaLabel}</span>}
            </div>

            {dados.status === "aprovado" && (
              <div className="flex items-center gap-1 mb-6">
                {ETAPAS_ORDEM.map((et, i) => {
                  const idxAtual = ETAPAS_ORDEM.indexOf(dados.etapaAtual || "");
                  const feito = i < idxAtual || dados.etapaAtual === "concluido";
                  const atual = et === dados.etapaAtual;
                  return (
                    <div key={et} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full h-1.5 rounded-full"
                        style={{ background: feito || atual ? "var(--ntk-laranja)" : "var(--ntk-borda)" }}
                      />
                      <span className="text-[10px] uppercase font-mono text-neutral-500">{et}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <dl className="text-sm grid grid-cols-2 gap-y-1">
              <dt className="text-neutral-500">Valor</dt>
              <dd className="text-right">{dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd>
              <dt className="text-neutral-500">Aberta em</dt>
              <dd className="text-right">{new Date(dados.criadoEm).toLocaleDateString("pt-BR")}</dd>
            </dl>

            <Link href="/refaturamento" className="text-sm underline underline-offset-4 mt-6 inline-block" style={{ color: "var(--ntk-laranja-forte)" }}>
              ← Nova solicitação
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
