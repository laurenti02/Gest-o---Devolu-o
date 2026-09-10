import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import db from "../lib/db";
import { formatBRL } from "../lib/format";

export default function JaSolicitei() {
  const [params] = useSearchParams();
  const [protocolo, setProtocolo] = useState(params.get("protocolo") || "");
  const [arquivo, setArquivo] = useState(null);
  const [erros, setErros] = useState({});
  const [etapaEnvio, setEtapaEnvio] = useState("idle"); // idle | validando | lendo | registrando | concluido
  const [leitura, setLeitura] = useState(null);
  const [protocoloConfirmado, setProtocoloConfirmado] = useState("");

  function validar() {
    const novosErros = {};
    if (!protocolo.trim()) {
      novosErros.protocolo = "Informe o protocolo.";
    } else {
      const found = db.buscarPorProtocolo(protocolo);
      if (!found) {
        novosErros.protocolo = "Protocolo não encontrado.";
      } else if (found.status === "reprovado") {
        novosErros.protocolo = "Esta solicitação foi reprovada. Não é possível anexar a NF.";
      } else if (
        ["aguardando_diretoria", "aguardando_gerente", "aguardando_adm"].includes(found.status)
      ) {
        novosErros.protocolo = "Esta solicitação ainda está em aprovação interna. Aguarde a aprovação para anexar a NF.";
      } else if (!(found.status === "aguardando_nfd" && found.etapaOperacionalAtual === "validacao_nfd")) {
        novosErros.protocolo = "Esta solicitação não está aguardando o envio da NF de devolução no momento.";
      }
    }
    if (!arquivo) {
      novosErros.arquivo = "Selecione o arquivo da NF de devolução.";
    } else if (!/\.(pdf|xml|png|jpg|jpeg)$/i.test(arquivo.name)) {
      novosErros.arquivo = "Formato inválido. Envie PDF, XML ou imagem (PNG/JPG).";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function enviar(e) {
    e.preventDefault();
    if (!validar()) return;

    const sol = db.buscarPorProtocolo(protocolo);

    setEtapaEnvio("validando");
    await sleep(500);

    setEtapaEnvio("lendo");
    await sleep(900);
    // Leitura inteligente simulada da NF — em produção, integrar com serviço
    // de OCR/leitura fiscal e validar CNPJ, valor total e soma dos itens.
    const itensSimulados = [
      { codigo: "IT-001", descricao: "Item conforme NF de origem", quantidade: 1, valorUnitario: 0, valorTotal: 0 },
    ];
    const leituraResult = {
      numeroNota: `NFD-${Math.floor(Math.random() * 90000 + 10000)}`,
      cliente: "—",
      cnpj: "—",
      valorTotal: 0,
      itens: itensSimulados,
      inconsistencias: [],
    };

    setEtapaEnvio("registrando");
    await sleep(600);
    db.registrarAnexo({ solicitacaoId: sol.id, arquivo, tipo: "nf_devolucao" });
    db.registrarLeituraNF({ solicitacaoId: sol.id, ...leituraResult });
    db.marcarNFEnviada(sol.id);

    setLeitura(leituraResult);
    setProtocoloConfirmado(sol.protocolo);
    setEtapaEnvio("concluido");
  }

  if (etapaEnvio === "concluido") {
    return (
      <div className="min-h-screen bg-sand font-body text-ink">
        <Topo />
        <div className="mx-auto max-w-md px-6 py-14 text-center">
          <div className="rounded-sm border border-ok/30 bg-okbg px-5 py-6">
            <p className="font-medium text-ok">NF de devolução enviada</p>
            <p className="mt-1 text-sm text-ok/80">
              Protocolo {protocoloConfirmado} · {leitura?.numeroNota} · {formatBRL(leitura?.valorTotal)}
            </p>
            <p className="mt-2 text-sm text-ok/80">
              O ADM e o Fiscal vão conferir os dados lidos.
            </p>
          </div>
          <Link to="/" className="mt-8 block text-center text-sm text-muted underline decoration-dotted">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand font-body text-ink">
      <Topo />

      <div className="mx-auto max-w-md px-6 py-14">
        <h1 className="font-display text-xl font-semibold">Já solicitei</h1>
        <p className="mt-1 text-sm text-muted">
          Informe o protocolo aprovado e anexe a NF de devolução.
        </p>

        <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Protocolo</span>
            <input
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value)}
              placeholder="DEV-2026-00001"
              disabled={etapaEnvio !== "idle"}
              className={`w-full rounded-sm border bg-white px-3 py-2.5 text-sm outline-none focus:border-ntk disabled:opacity-60 ${
                erros.protocolo ? "border-bad" : "border-line"
              }`}
            />
            {erros.protocolo && <span className="mt-1 block text-xs text-bad">{erros.protocolo}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Arquivo da NF de devolução (PDF, XML ou imagem)
            </span>
            <input
              type="file"
              accept=".pdf,.xml,image/*"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              disabled={etapaEnvio !== "idle"}
              className={`w-full rounded-sm border bg-white px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-sm file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-sm disabled:opacity-60 ${
                erros.arquivo ? "border-bad" : "border-line"
              }`}
            />
            {erros.arquivo && <span className="mt-1 block text-xs text-bad">{erros.arquivo}</span>}
          </label>

          {etapaEnvio !== "idle" && (
            <div className="space-y-1.5 rounded-sm border border-line bg-white px-4 py-3 text-sm">
              <ProgressoLinha ativo={etapaEnvio} etapa="validando" label="Validando protocolo e arquivo" />
              <ProgressoLinha ativo={etapaEnvio} etapa="lendo" label="Lendo dados da NF" />
              <ProgressoLinha ativo={etapaEnvio} etapa="registrando" label="Registrando anexo" />
            </div>
          )}

          <button
            type="submit"
            disabled={etapaEnvio !== "idle"}
            className="w-full rounded-sm bg-ntk py-3 text-sm font-semibold text-ink hover:bg-ntk-dark hover:text-white disabled:opacity-50"
          >
            Enviar NF de devolução
          </button>
        </form>

        <Link to="/" className="mt-8 block text-center text-sm text-muted underline decoration-dotted">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function Topo() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink font-display text-sm font-bold text-ntk">
          NTK
        </div>
        <p className="font-display text-lg font-semibold">Gestão de Devoluções</p>
      </div>
    </header>
  );
}

function ProgressoLinha({ ativo, etapa, label }) {
  const ordem = ["validando", "lendo", "registrando", "concluido"];
  const atual = ordem.indexOf(ativo);
  const este = ordem.indexOf(etapa);
  const feito = atual > este;
  const emAndamento = atual === este;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          feito ? "bg-ok" : emAndamento ? "bg-ntk animate-pulse" : "bg-line"
        }`}
      />
      <span className={feito || emAndamento ? "text-ink" : "text-muted"}>{label}</span>
    </div>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
