import { useState } from "react";
import db from "../lib/db";
import { useAuth } from "../lib/auth";
import InternalShell from "../components/InternalShell";
import { formatDateTime } from "../lib/format";

const CAMPOS_INICIAIS = {
  nomeSolicitante: "",
  gerenteRegional: "",
  codigoCliente: "",
  numeroNota: "",
  numeroPedido: "",
};

const ETAPAS = ["Logística", "Fiscal", "ADM", "Comercial", "Financeiro"];

export default function Refaturamento() {
  const { usuario } = useAuth();
  const [, force] = useState(0);
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [erros, setErros] = useState({});
  const [decisao, setDecisao] = useState({}); // { [refId]: { status, comentario } }
  const [selecionado, setSelecionado] = useState(null);

  const lista = db.listarRefaturamentos();

  function setCampo(nome, valor) {
    setCampos((c) => ({ ...c, [nome]: valor }));
  }

  function validar() {
    const novosErros = {};
    if (!campos.nomeSolicitante.trim()) novosErros.nomeSolicitante = "Obrigatório.";
    if (!campos.gerenteRegional.trim()) novosErros.gerenteRegional = "Obrigatório.";
    if (!campos.codigoCliente.trim()) novosErros.codigoCliente = "Obrigatório.";
    if (!campos.numeroNota.trim()) novosErros.numeroNota = "Obrigatório.";
    if (!campos.numeroPedido.trim()) novosErros.numeroPedido = "Obrigatório.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function criar(e) {
    e.preventDefault();
    if (!validar()) return;
    db.criarRefaturamento(campos);
    setCampos(CAMPOS_INICIAIS);
    force((n) => n + 1);
  }

  function avancar(ref) {
    const d = decisao[ref.id];
    if (!d?.status || !d?.comentario?.trim()) return;
    db.avancarRefaturamento(ref.id, {
      usuario: usuario.email,
      comentario: `[${d.status}] ${d.comentario}`,
    });
    setDecisao((c) => ({ ...c, [ref.id]: undefined }));
    force((n) => n + 1);
  }

  return (
    <InternalShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="font-display text-2xl font-semibold">Refaturamento</h1>
        <p className="mt-1 text-sm text-muted">
          Cada etapa exige status e comentário para avançar por Logística, Fiscal, ADM, Comercial e Financeiro. Prazo de 24h corridas por etapa.
        </p>

        <form onSubmit={criar} className="mt-6 space-y-3 rounded-sm border border-line bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CampoTexto
              label="Nome do solicitante"
              valor={campos.nomeSolicitante}
              erro={erros.nomeSolicitante}
              onChange={(v) => setCampo("nomeSolicitante", v)}
            />
            <CampoTexto
              label="Gerente regional"
              valor={campos.gerenteRegional}
              erro={erros.gerenteRegional}
              onChange={(v) => setCampo("gerenteRegional", v)}
            />
            <CampoTexto
              label="Código do cliente"
              valor={campos.codigoCliente}
              erro={erros.codigoCliente}
              onChange={(v) => setCampo("codigoCliente", v)}
            />
            <CampoTexto
              label="Número da nota fiscal"
              valor={campos.numeroNota}
              erro={erros.numeroNota}
              onChange={(v) => setCampo("numeroNota", v)}
            />
            <CampoTexto
              label="Número do pedido"
              valor={campos.numeroPedido}
              erro={erros.numeroPedido}
              onChange={(v) => setCampo("numeroPedido", v)}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-ntk py-2.5 text-sm font-semibold text-ink hover:bg-ntk-dark hover:text-white"
          >
            Abrir refaturamento
          </button>
        </form>

        <div className="mt-8 space-y-3">
          {lista.map((ref) => {
            const etapas = db.listarEtapasRefaturamento(ref.id);
            const aberto = selecionado === ref.id;
            const d = decisao[ref.id] || { status: "", comentario: "" };
            const idxAtual = ETAPAS.indexOf(ref.etapaAtual);

            return (
              <div key={ref.id} className="rounded-sm border border-line bg-white">
                <button
                  onClick={() => setSelecionado(aberto ? null : ref.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="font-medium">{ref.protocolo}</p>
                    <p className="text-xs text-muted">
                      NF {ref.numeroNota} · Pedido {ref.numeroPedido} · Cliente {ref.codigoCliente}
                    </p>
                  </div>
                  <span className="text-sm">
                    {ref.status === "concluido" ? (
                      <span className="text-ok">Concluído</span>
                    ) : (
                      <span className="text-warn">Etapa atual: {ref.etapaAtual}</span>
                    )}
                  </span>
                </button>

                {aberto && (
                  <div className="border-t border-line px-4 py-4">
                    {/* Barra de progresso das 5 etapas */}
                    <div className="mb-4 flex items-center gap-1.5">
                      {ETAPAS.map((et, i) => {
                        const feita = ref.status === "concluido" || i < idxAtual;
                        const atual = ref.status !== "concluido" && i === idxAtual;
                        return (
                          <div key={et} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className={`h-1.5 w-full rounded-full ${
                                feita ? "bg-ok" : atual ? "bg-ntk" : "bg-line"
                              }`}
                            />
                            <span className={`text-[10px] ${atual ? "font-medium text-ink" : "text-muted"}`}>
                              {et}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <ul className="mb-3 space-y-1.5 text-sm">
                      {etapas.map((e) => (
                        <li key={e.id} className="flex justify-between rounded-sm bg-sand px-3 py-2">
                          <span>{e.etapa}</span>
                          <span className={e.status === "concluida" ? "text-ok" : "text-warn"}>
                            {e.status === "concluida"
                              ? `Concluída em ${formatDateTime(e.concluidoEm)}`
                              : `Prazo: ${formatDateTime(e.prazoEm)}`}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {ref.status !== "concluido" && (
                      <div className="space-y-2 border-t border-line pt-3">
                        <div className="flex gap-2">
                          {["Aprovado", "Pendência"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                setDecisao((c) => ({ ...c, [ref.id]: { ...d, status: opt } }))
                              }
                              className={`rounded-sm border px-3 py-1.5 text-xs font-medium ${
                                d.status === opt
                                  ? opt === "Aprovado"
                                    ? "border-ok bg-okbg text-ok"
                                    : "border-warn bg-warnbg text-warn"
                                  : "border-line text-muted hover:text-ink"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={d.comentario}
                          onChange={(ev) =>
                            setDecisao((c) => ({
                              ...c,
                              [ref.id]: { ...d, comentario: ev.target.value },
                            }))
                          }
                          placeholder="Comentário da etapa atual (obrigatório)"
                          className="w-full rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-ntk"
                        />
                        <button
                          onClick={() => avancar(ref)}
                          disabled={!d.status || !d.comentario?.trim()}
                          className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-40"
                        >
                          Concluir etapa e avançar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {lista.length === 0 && (
            <p className="rounded-sm border border-line bg-white px-4 py-8 text-center text-muted">
              Nenhum refaturamento aberto.
            </p>
          )}
        </div>
      </div>
    </InternalShell>
  );
}

function CampoTexto({ label, valor, erro, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-sm border px-3 py-2 text-sm outline-none focus:border-ntk ${
          erro ? "border-bad" : "border-line"
        }`}
      />
      {erro && <span className="mt-0.5 block text-xs text-bad">{erro}</span>}
    </label>
  );
}
