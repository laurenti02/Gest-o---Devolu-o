"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarcaNTK } from "@/components/MarcaNTK";

type StatusProtocolo = {
  protocolo: string;
  empresa: string;
  valor: number;
  status: string;
  statusLabel: string;
  criadoEm: string;
  podeAnexarNf: boolean;
  nfJaAnexada: boolean;
};

const CORES_STATUS: Record<string, string> = {
  aguardando_aprovacao: "var(--ntk-laranja-forte)",
  aprovado: "var(--ntk-verde)",
  reprovado: "var(--ntk-vermelho)",
  em_andamento: "var(--ntk-verde)",
  concluido: "var(--ntk-verde)",
};

export default function PaginaProtocolo() {
  const params = useParams<{ protocolo: string }>();
  const [dados, setDados] = useState<StatusProtocolo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviandoNf, setEnviandoNf] = useState(false);
  const [msgNf, setMsgNf] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(`/api/solicitacoes/${params.protocolo}`);
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Protocolo não encontrado.");
        return;
      }
      setDados(json);
    } catch {
      setErro("Falha ao consultar o protocolo.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.protocolo]);

  async function enviarNf(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviandoNf(true);
    setMsgNf(null);
    try {
      const form = new FormData();
      form.append("protocolo", String(params.protocolo));
      form.append("arquivo", arquivo);
      const resp = await fetch("/api/anexos", { method: "POST", body: form });
      const json = await resp.json();
      if (!resp.ok) {
        setMsgNf({ tipo: "erro", texto: json.erro || "Falha ao enviar a NF." });
        return;
      }
      setMsgNf({
        tipo: "ok",
        texto:
          json.status === "conferido"
            ? "NF de devolução recebida e validada com sucesso."
            : "NF de devolução recebida. Algumas informações precisarão de conferência manual.",
      });
      carregar();
    } catch {
      setMsgNf({ tipo: "erro", texto: "Falha de conexão ao enviar o arquivo." });
    } finally {
      setEnviandoNf(false);
    }
  }

  return (
    <main className="flex-1 px-4 py-8" style={{ background: "var(--ntk-osso)" }}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <MarcaNTK subtitulo="Controle de Devoluções" />
          <Link href="/" className="text-sm underline underline-offset-4" style={{ color: "var(--ntk-laranja-forte)" }}>
            Nova solicitação
          </Link>
        </div>

        <div className="ntk-card p-6 sm:p-8">
          {carregando && <p className="text-sm text-neutral-500">Consultando protocolo...</p>}

          {!carregando && erro && (
            <div>
              <p className="text-sm px-3 py-2 rounded" style={{ background: "#fbe9e5", color: "var(--ntk-vermelho)" }}>
                {erro}
              </p>
              <Link href="/ja-solicitei" className="text-sm underline underline-offset-4 mt-4 inline-block">
                Tentar outro protocolo
              </Link>
            </div>
          )}

          {!carregando && dados && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">Protocolo</span>
                <span
                  className="ntk-tag"
                  style={{ color: CORES_STATUS[dados.status] || "var(--ntk-preto)" }}
                >
                  {dados.statusLabel}
                </span>
              </div>
              <div className="font-display text-2xl font-bold mt-1 mb-4">{dados.protocolo}</div>

              <dl className="text-sm grid grid-cols-2 gap-y-2 border-t pt-4" style={{ borderColor: "var(--ntk-borda)" }}>
                <dt className="text-neutral-500">Empresa</dt>
                <dd className="text-right font-medium">{dados.empresa}</dd>
                <dt className="text-neutral-500">Valor</dt>
                <dd className="text-right font-medium">
                  {dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </dd>
                <dt className="text-neutral-500">Registrado em</dt>
                <dd className="text-right font-medium">
                  {new Date(dados.criadoEm).toLocaleDateString("pt-BR")}
                </dd>
              </dl>

              {dados.status === "aguardando_aprovacao" && (
                <p className="text-sm text-neutral-600 mt-5">
                  Sua solicitação está em análise pela Diretoria e Gerência. Assim que for aprovada,
                  esta página liberará o envio da NF de devolução.
                </p>
              )}

              {dados.status === "reprovado" && (
                <p className="text-sm mt-5" style={{ color: "var(--ntk-vermelho)" }}>
                  Esta solicitação foi reprovada. Entre em contato com seu responsável regional para mais informações.
                </p>
              )}

              {dados.nfJaAnexada && dados.status !== "reprovado" && (
                <p className="text-sm text-neutral-600 mt-5">
                  A NF de devolução já foi recebida. Acompanhe o andamento com seu contato interno.
                </p>
              )}

              {dados.podeAnexarNf && (
                <form onSubmit={enviarNf} className="mt-6 border-t pt-5" style={{ borderColor: "var(--ntk-borda)" }}>
                  <label className="text-sm font-medium block mb-1">Anexar NF de devolução (PDF, XML ou imagem)</label>
                  <input
                    type="file"
                    accept=".pdf,.xml,.png,.jpg,.jpeg"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    className="ntk-input"
                  />
                  {msgNf && (
                    <p
                      className="text-sm px-3 py-2 rounded mt-3"
                      style={{
                        background: msgNf.tipo === "ok" ? "#eaf4ec" : "#fbe9e5",
                        color: msgNf.tipo === "ok" ? "var(--ntk-verde)" : "var(--ntk-vermelho)",
                      }}
                    >
                      {msgNf.texto}
                    </p>
                  )}
                  <button type="submit" disabled={!arquivo || enviandoNf} className="ntk-btn-primary py-2.5 px-4 text-sm mt-3">
                    {enviandoNf ? "Enviando..." : "Enviar NF de devolução"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
