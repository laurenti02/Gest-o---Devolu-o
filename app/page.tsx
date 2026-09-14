"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { MarcaNTK } from "@/components/MarcaNTK";

const CAMPOS_INICIAIS = {
  empresa: "",
  cnpj: "",
  nomeSolicitante: "",
  responsavelRegional: "",
  nfOrigem: "",
  valor: "",
  motivo: "",
};

export default function PaginaInicial() {
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [buscaProtocolo, setBuscaProtocolo] = useState("");

  function atualizar(campo: keyof typeof CAMPOS_INICIAIS, valor: string) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resp = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });
      const dados = await resp.json();
      if (!resp.ok) {
        setErro(dados.erro || "Não foi possível registrar a solicitação.");
        return;
      }
      setProtocolo(dados.protocolo);
      setCampos(CAMPOS_INICIAIS);
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (protocolo) {
    return (
      <main className="flex-1 flex items-center justify-center px-4" style={{ background: "var(--ntk-osso)" }}>
        <div className="ntk-card p-8 max-w-md w-full text-center">
          <MarcaNTK subtitulo="Controle de Devoluções" />
          <div className="mt-6 mb-2 text-sm uppercase tracking-wide font-mono" style={{ color: "var(--ntk-verde)" }}>
            Solicitação registrada
          </div>
          <div className="font-display text-3xl font-bold mb-1">{protocolo}</div>
          <p className="text-sm text-neutral-600 mt-3">
            Guarde este número de protocolo. Ele será usado para consultar o andamento e, após a
            aprovação, para anexar a NF de devolução.
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Link href={`/protocolo/${protocolo}`} className="ntk-btn-primary py-2.5 px-4 text-sm text-center">
              Acompanhar este protocolo
            </Link>
            <button onClick={() => setProtocolo(null)} className="ntk-btn-outline py-2.5 px-4 text-sm">
              Registrar nova solicitação
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8" style={{ background: "var(--ntk-osso)" }}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <MarcaNTK subtitulo="Controle de Devoluções" />
          <div className="flex items-center gap-4">
            <Link
              href="/refaturamento"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: "var(--ntk-laranja-forte)" }}
            >
              Solicitar refaturamento
            </Link>
            <Link
              href="/ja-solicitei"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: "var(--ntk-laranja-forte)" }}
            >
              Já solicitei
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: "var(--ntk-preto)" }}
            >
              Acesso interno
            </Link>
          </div>
        </div>

        <div className="ntk-card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Solicitar devolução</h1>
          <p className="text-sm text-neutral-600 mb-6">
            Preencha os dados abaixo para registrar a solicitação e gerar o protocolo.
          </p>

          <form onSubmit={enviar} className="flex flex-col gap-4">
            <Campo label="Nome da empresa" valor={campos.empresa} onChange={(v) => atualizar("empresa", v)} />
            <Campo label="CNPJ" valor={campos.cnpj} onChange={(v) => atualizar("cnpj", v)} placeholder="00.000.000/0000-00" />
            <Campo label="Nome do solicitante" valor={campos.nomeSolicitante} onChange={(v) => atualizar("nomeSolicitante", v)} />
            <Campo label="Responsável regional" valor={campos.responsavelRegional} onChange={(v) => atualizar("responsavelRegional", v)} />
            <Campo label="NF de origem" valor={campos.nfOrigem} onChange={(v) => atualizar("nfOrigem", v)} />
            <Campo
              label="Valor da nota de devolução (R$)"
              valor={campos.valor}
              onChange={(v) => atualizar("valor", v)}
              tipo="number"
            />
            <div>
              <label className="text-sm font-medium block mb-1">Descrição do motivo</label>
              <textarea
                className="ntk-input min-h-[100px]"
                value={campos.motivo}
                onChange={(e) => atualizar("motivo", e.target.value)}
                required
              />
            </div>

            {erro && (
              <div
                className="text-sm px-3 py-2 rounded"
                style={{ background: "#fbe9e5", color: "var(--ntk-vermelho)" }}
              >
                {erro}
              </div>
            )}

            <button type="submit" disabled={enviando} className="ntk-btn-primary py-3 mt-2 text-sm">
              {enviando ? "Enviando..." : "Registrar solicitação"}
            </button>
          </form>
        </div>

        <div className="ntk-card p-5 mt-4">
          <p className="text-xs text-neutral-500 mb-2">Já tem um protocolo?</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (buscaProtocolo.trim()) window.location.href = `/protocolo/${buscaProtocolo.trim().toUpperCase()}`;
            }}
            className="flex gap-2"
          >
            <input
              className="ntk-input"
              placeholder="DEV-2026-000123"
              value={buscaProtocolo}
              onChange={(e) => setBuscaProtocolo(e.target.value)}
            />
            <button className="ntk-btn-outline px-4 text-sm whitespace-nowrap">Consultar</button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Campo({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        className="ntk-input"
        type={tipo}
        step={tipo === "number" ? "0.01" : undefined}
        min={tipo === "number" ? "0" : undefined}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
