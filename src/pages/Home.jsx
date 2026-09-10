import { useState } from "react";
import { useNavigate } from "react-router-dom";
import db from "../lib/db";

const CAMPOS_INICIAIS = {
  nomeEmpresa: "",
  cnpj: "",
  nomeSolicitante: "",
  responsavelRegional: "",
  nfOrigem: "",
  valorNota: "",
  descricaoMotivo: "",
};

function maskCNPJ(value) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function Home() {
  const navigate = useNavigate();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [erros, setErros] = useState({});
  const [protocoloGerado, setProtocoloGerado] = useState(null);
  const [buscaProtocolo, setBuscaProtocolo] = useState("");
  const [erroBusca, setErroBusca] = useState("");

  function setCampo(nome, valor) {
    setCampos((c) => ({ ...c, [nome]: valor }));
  }

  function validar() {
    const novosErros = {};
    if (!campos.nomeEmpresa.trim()) novosErros.nomeEmpresa = "Informe o nome da empresa.";
    if (campos.cnpj.replace(/\D/g, "").length !== 14) novosErros.cnpj = "CNPJ deve ter 14 dígitos.";
    if (!campos.nomeSolicitante.trim()) novosErros.nomeSolicitante = "Informe seu nome.";
    if (!campos.responsavelRegional.trim()) novosErros.responsavelRegional = "Informe o responsável regional.";
    if (!campos.nfOrigem.trim()) novosErros.nfOrigem = "Informe a NF de origem.";
    if (!campos.valorNota || Number(campos.valorNota) <= 0) novosErros.valorNota = "Informe um valor válido.";
    if (!campos.descricaoMotivo.trim()) novosErros.descricaoMotivo = "Descreva o motivo da devolução.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function enviar(e) {
    e.preventDefault();
    if (!validar()) return;
    const solicitacao = db.criarSolicitacao(campos);
    setProtocoloGerado(solicitacao.protocolo);
    setCampos(CAMPOS_INICIAIS);
  }

  function buscar(e) {
    e.preventDefault();
    setErroBusca("");
    const sol = db.buscarPorProtocolo(buscaProtocolo);
    if (!sol) {
      setErroBusca("Protocolo não encontrado. Confira o número e tente novamente.");
      return;
    }
    navigate(`/status/${sol.protocolo}`);
  }

  if (protocoloGerado) {
    return (
      <div className="min-h-screen bg-sand font-body text-ink">
        <TopoPublico />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <p className="font-display text-sm uppercase tracking-wide text-muted">
            Solicitação registrada
          </p>
          <div className="mt-4 rounded-sm border-2 border-ntk bg-white px-6 py-8">
            <p className="text-sm text-muted">Seu protocolo</p>
            <p className="mt-2 font-display text-4xl font-bold text-ink">
              {protocoloGerado}
            </p>
          </div>
          <p className="mt-6 text-sm text-muted">
            Guarde este número. Use-o na página inicial para acompanhar o
            andamento ou para enviar a NF de devolução após a aprovação.
          </p>
          <button
            onClick={() => setProtocoloGerado(null)}
            className="mt-8 rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand font-body text-ink">
      <TopoPublico />

      <div className="mx-auto max-w-2xl px-6 pb-20 pt-10">
        {/* Rastreamento */}
        <form
          onSubmit={buscar}
          className="mb-10 flex items-stretch overflow-hidden rounded-sm border border-line bg-white"
        >
          <input
            value={buscaProtocolo}
            onChange={(e) => setBuscaProtocolo(e.target.value)}
            placeholder="Já tem um protocolo? Digite para consultar — ex: DEV-2026-00001"
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="shrink-0 bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90"
          >
            Consultar
          </button>
        </form>
        {erroBusca && <p className="-mt-8 mb-8 text-sm text-bad">{erroBusca}</p>}

        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-semibold">
            Solicitar devolução
          </h1>
          <span className="text-xs text-muted">
            Sem necessidade de login ou senha
          </span>
        </div>

        <form onSubmit={enviar} noValidate className="space-y-5">
          <Campo
            label="Nome da empresa"
            erro={erros.nomeEmpresa}
          >
            <input
              className={inputClass(erros.nomeEmpresa)}
              value={campos.nomeEmpresa}
              onChange={(e) => setCampo("nomeEmpresa", e.target.value)}
              placeholder="Razão social do cliente"
            />
          </Campo>

          <Campo label="CNPJ" erro={erros.cnpj}>
            <input
              className={inputClass(erros.cnpj)}
              value={campos.cnpj}
              onChange={(e) => setCampo("cnpj", maskCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Seu nome" erro={erros.nomeSolicitante}>
              <input
                className={inputClass(erros.nomeSolicitante)}
                value={campos.nomeSolicitante}
                onChange={(e) => setCampo("nomeSolicitante", e.target.value)}
              />
            </Campo>
            <Campo label="Responsável regional" erro={erros.responsavelRegional}>
              <input
                className={inputClass(erros.responsavelRegional)}
                value={campos.responsavelRegional}
                onChange={(e) => setCampo("responsavelRegional", e.target.value)}
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="NF de origem" erro={erros.nfOrigem}>
              <input
                className={inputClass(erros.nfOrigem)}
                value={campos.nfOrigem}
                onChange={(e) => setCampo("nfOrigem", e.target.value)}
                placeholder="Número da nota"
              />
            </Campo>
            <Campo label="Valor da nota de devolução" erro={erros.valorNota}>
              <input
                className={inputClass(erros.valorNota)}
                value={campos.valorNota}
                onChange={(e) => setCampo("valorNota", e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="R$ 0,00"
                inputMode="decimal"
              />
            </Campo>
          </div>

          <Campo label="Descrição do motivo" erro={erros.descricaoMotivo}>
            <textarea
              className={inputClass(erros.descricaoMotivo) + " min-h-[100px] resize-y"}
              value={campos.descricaoMotivo}
              onChange={(e) => setCampo("descricaoMotivo", e.target.value)}
              placeholder="Explique o motivo da devolução"
            />
          </Campo>

          <button
            type="submit"
            className="w-full rounded-sm bg-ntk py-3 text-sm font-semibold text-ink hover:bg-ntk-dark hover:text-white"
          >
            Enviar solicitação
          </button>
        </form>

        <div className="mt-10 border-t border-line pt-6 text-center">
          <p className="text-sm text-muted">
            Já teve sua devolução aprovada e precisa anexar a NF de devolução?
          </p>
          <button
            onClick={() => navigate("/ja-solicitei")}
            className="mt-2 text-sm font-medium text-ntk-dark underline decoration-dotted underline-offset-2"
          >
            Já solicitei
          </button>
        </div>
      </div>

      <RodapeInstalacao />
    </div>
  );
}

function TopoPublico() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink font-display text-sm font-bold text-ntk">
          NTK
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">
            Gestão de Devoluções
          </p>
          <p className="text-xs text-muted">Grupo Nautika</p>
        </div>
      </div>
    </header>
  );
}

function RodapeInstalacao() {
  return (
    <div className="border-t border-line bg-white py-6 text-center text-xs text-muted">
      Instale este formulário como aplicativo no seu computador para acesso
      rápido — use o menu do navegador em "Instalar app" ou "Adicionar à área
      de trabalho".
    </div>
  );
}

function Campo({ label, erro, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {erro && <span className="mt-1 block text-xs text-bad">{erro}</span>}
    </label>
  );
}

function inputClass(erro) {
  return `w-full rounded-sm border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-ntk ${
    erro ? "border-bad" : "border-line"
  }`;
}
