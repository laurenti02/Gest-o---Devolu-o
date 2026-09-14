"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { MarcaNTK } from "@/components/MarcaNTK";

const CAMPOS_INICIAIS = {
  solicitante: "",
  setorSolicitante: "",
  clienteOriginal: "",
  cnpjOriginal: "",
  notaFiscalOriginal: "",
  valor: "",
  mercadoriaSaiu: "",
  novoDestinatario: "",
  novoCnpj: "",
  motivo: "",
};

export default function PaginaRefaturamento() {
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
      const resp = await fetch("/api/refaturamento", {
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
          <MarcaNTK subtitulo="Refaturamento" />
          <div className="mt-6 mb-2 text-sm uppercase tracking-wide font-mono" style={{ color: "var(--ntk-verde)" }}>
            Solicitação registrada
          </div>
          <div className="font-display text-3xl font-bold mb-1">{protocolo}</div>
          <p className="text-sm text-neutral-600 mt-3">
            Guarde este número de protocolo. Ele será usado para consultar o andamento pelas
            etapas: ADM → Logística → Fiscal → Financeiro.
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Link href={`/refaturamento/protocolo/${protocolo}`} className="ntk-btn-primary py-2.5 px-4 text-sm text-center">
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
          <MarcaNTK subtitulo="Refaturamento" />
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: "var(--ntk-laranja-forte)" }}
            >
              Solicitar devolução
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
          <h1 className="font-display text-2xl font-bold mb-1">Solicitar refaturamento</h1>
          <p className="text-sm text-neutral-600 mb-6">
            Preencha os dados da nota original. A solicitação passa pela aprovação do ADM e
            depois segue por Logística, Fiscal e Financeiro até a emissão da nova nota.
          </p>

          <form onSubmit={enviar} className="flex flex-col gap-4">
            <Campo label="Solicitante" valor={campos.solicitante} onChange={(v) => atualizar("solicitante", v)} />
            <Campo label="Setor / Regional" valor={campos.setorSolicitante} onChange={(v) => atualizar("setorSolicitante", v)} placeholder="Ex.: Comercial Regional Sul" />
            <Campo label="Cliente (nota original)" valor={campos.clienteOriginal} onChange={(v) => atualizar("clienteOriginal", v)} />
            <Campo label="CNPJ (nota original)" valor={campos.cnpjOriginal} onChange={(v) => atualizar("cnpjOriginal", v)} placeholder="00.000.000/0000-00" />
            <Campo label="Nota fiscal original" valor={campos.notaFiscalOriginal} onChange={(v) => atualizar("notaFiscalOriginal", v)} />
            <Campo label="Valor da nota (R$)" valor={campos.valor} onChange={(v) => atualizar("valor", v)} tipo="number" />

            <div>
              <label className="text-sm font-medium block mb-1">A mercadoria já saiu da empresa?</label>
              <div className="flex gap-5 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="mercadoriaSaiu" value="nao" checked={campos.mercadoriaSaiu === "nao"} onChange={() => atualizar("mercadoriaSaiu", "nao")} required /> Não
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="mercadoriaSaiu" value="sim" checked={campos.mercadoriaSaiu === "sim"} onChange={() => atualizar("mercadoriaSaiu", "sim")} /> Sim
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Define se será cancelamento direto ou recusa/devolução registrada.</p>
            </div>

            <Campo label="Novo destinatário (se houver troca)" valor={campos.novoDestinatario} onChange={(v) => atualizar("novoDestinatario", v)} placeholder="Deixe em branco se não muda" obrigatorio={false} />
            <Campo label="Novo CNPJ (se houver troca)" valor={campos.novoCnpj} onChange={(v) => atualizar("novoCnpj", v)} placeholder="Deixe em branco se não muda" obrigatorio={false} />

            <div>
              <label className="text-sm font-medium block mb-1">Motivo do refaturamento</label>
              <textarea
                className="ntk-input min-h-[100px]"
                value={campos.motivo}
                onChange={(e) => atualizar("motivo", e.target.value)}
                placeholder="Erro de destinatário, valores, impostos, recusa da mercadoria etc."
                required
              />
            </div>

            {erro && (
              <div className="text-sm px-3 py-2 rounded" style={{ background: "#fbe9e5", color: "var(--ntk-vermelho)" }}>
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
              if (buscaProtocolo.trim()) window.location.href = `/refaturamento/protocolo/${buscaProtocolo.trim().toUpperCase()}`;
            }}
            className="flex gap-2"
          >
            <input
              className="ntk-input"
              placeholder="REF-2026-000123"
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
  obrigatorio = true,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  obrigatorio?: boolean;
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
        required={obrigatorio}
      />
    </div>
  );
}
