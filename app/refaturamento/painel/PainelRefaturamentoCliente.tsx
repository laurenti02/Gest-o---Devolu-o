"use client";

import { useState } from "react";

type Item = {
  id: number;
  protocolo: string;
  clienteOriginal: string;
  cnpjOriginal: string;
  notaFiscalOriginal: string;
  valor: number;
  mercadoriaSaiu: string;
  etapaAtual: string;
  criadoEm: string;
};

const ETAPA_POR_PERFIL: Record<string, string> = {
  logistica: "logistica",
  entrada_nfd: "fiscal",
  financeiro: "financeiro",
};

export function PainelRefaturamentoCliente({
  listaInicial,
  perfil,
  isAdmin,
}: {
  listaInicial: Item[];
  perfil: string;
  isAdmin: boolean;
}) {
  const [lista, setLista] = useState(listaInicial);
  const [abertoId, setAbertoId] = useState<number | null>(null);

  const minhaEtapa = ETAPA_POR_PERFIL[perfil];

  function podeAgir(item: Item) {
    return isAdmin || item.etapaAtual === minhaEtapa;
  }

  function remover(id: number) {
    setLista((l) => l.filter((i) => i.id !== id));
    setAbertoId(null);
  }

  if (lista.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhuma solicitação nesta etapa no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.map((item) => (
        <div key={item.id} className="ntk-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-bold">{item.protocolo}</span>
            <span className="ntk-tag">{item.etapaAtual}</span>
          </div>
          <dl className="text-sm grid grid-cols-2 gap-y-1 mb-3">
            <dt className="text-neutral-500">Cliente</dt>
            <dd className="text-right">{item.clienteOriginal}</dd>
            <dt className="text-neutral-500">CNPJ</dt>
            <dd className="text-right">{item.cnpjOriginal}</dd>
            <dt className="text-neutral-500">NF original</dt>
            <dd className="text-right">{item.notaFiscalOriginal}</dd>
            <dt className="text-neutral-500">Valor</dt>
            <dd className="text-right">{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd>
          </dl>

          {podeAgir(item) && (
            abertoId === item.id ? (
              <FormularioEtapa item={item} onConcluido={() => remover(item.id)} onCancelar={() => setAbertoId(null)} />
            ) : (
              <button onClick={() => setAbertoId(item.id)} className="ntk-btn-primary px-4 py-2 text-sm">
                Preencher e concluir etapa
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function FormularioEtapa({ item, onConcluido, onCancelar }: { item: Item; onConcluido: () => void; onCancelar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ---- Logística ----
  const [tipoRegularizacao, setTipoRegularizacao] = useState(item.mercadoriaSaiu === "sim" ? "Recusa registrada" : "Cancelamento");
  const [logComentario, setLogComentario] = useState("");

  // ---- Fiscal ----
  const [chaveNfEntrada, setChaveNfEntrada] = useState("");
  const [precisaSefaz, setPrecisaSefaz] = useState(false);
  const [protocoloSefaz, setProtocoloSefaz] = useState("");
  const [chaveNovaNfe, setChaveNovaNfe] = useState("");
  const [fiscalComentario, setFiscalComentario] = useState("");

  // ---- Financeiro ----
  const [finComentario, setFinComentario] = useState("");

  async function concluir() {
    setErro(null);
    setEnviando(true);
    try {
      let body: Record<string, unknown> = { id: item.id };
      if (item.etapaAtual === "logistica") {
        body = { ...body, tipoRegularizacao, comentario: logComentario };
      } else if (item.etapaAtual === "fiscal") {
        if (!chaveNfEntrada || !chaveNovaNfe) {
          setErro("Preencha as chaves obrigatórias.");
          setEnviando(false);
          return;
        }
        body = { ...body, chaveNfEntrada, precisaSefaz, protocoloSefaz, chaveNovaNfe, comentario: fiscalComentario };
      } else if (item.etapaAtual === "financeiro") {
        body = { ...body, comentario: finComentario };
      }

      const resp = await fetch("/api/refaturamento/etapa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Não foi possível concluir.");
        return;
      }
      onConcluido();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--ntk-borda)" }}>
      {item.etapaAtual === "logistica" && (
        <div className="flex flex-col gap-2 mb-3">
          <label className="text-sm font-medium">Como foi regularizado</label>
          <select className="ntk-input" value={tipoRegularizacao} onChange={(e) => setTipoRegularizacao(e.target.value)}>
            <option value="Cancelamento">Cancelamento da NF-e (mercadoria não saiu)</option>
            <option value="Recusa registrada">Recusa registrada pelo destinatário (mercadoria já enviada)</option>
          </select>
          <textarea className="ntk-input text-sm" placeholder="Comentário (opcional)" value={logComentario} onChange={(e) => setLogComentario(e.target.value)} />
        </div>
      )}

      {item.etapaAtual === "fiscal" && (
        <div className="flex flex-col gap-2 mb-3">
          <label className="text-sm font-medium">Chave da NF-e de entrada (devolução)</label>
          <input className="ntk-input" value={chaveNfEntrada} onChange={(e) => setChaveNfEntrada(e.target.value)} placeholder="44 dígitos" />
          <label className="flex items-center gap-2 text-sm mt-1">
            <input type="checkbox" checked={precisaSefaz} onChange={(e) => setPrecisaSefaz(e.target.checked)} />
            Precisou de liberação na SEFAZ (fronteira/porto)
          </label>
          {precisaSefaz && (
            <input className="ntk-input" value={protocoloSefaz} onChange={(e) => setProtocoloSefaz(e.target.value)} placeholder="Protocolo SEFAZ" />
          )}
          <label className="text-sm font-medium mt-1">Chave da nova NF-e (refaturamento)</label>
          <input className="ntk-input" value={chaveNovaNfe} onChange={(e) => setChaveNovaNfe(e.target.value)} placeholder="44 dígitos" />
          <textarea className="ntk-input text-sm" placeholder="Comentário (opcional)" value={fiscalComentario} onChange={(e) => setFiscalComentario(e.target.value)} />
        </div>
      )}

      {item.etapaAtual === "financeiro" && (
        <div className="flex flex-col gap-2 mb-3">
          <label className="text-sm font-medium">Comentário da conciliação</label>
          <textarea className="ntk-input text-sm" placeholder="Confirmação de valores, ajustes etc." value={finComentario} onChange={(e) => setFinComentario(e.target.value)} />
        </div>
      )}

      {erro && <p className="text-xs mb-2" style={{ color: "var(--ntk-vermelho)" }}>{erro}</p>}

      <div className="flex gap-2">
        <button disabled={enviando} onClick={concluir} className="ntk-btn-primary px-4 py-2 text-sm">
          {enviando ? "Salvando..." : "Concluir etapa"}
        </button>
        <button onClick={onCancelar} className="ntk-btn-outline px-4 py-2 text-sm">Cancelar</button>
      </div>
    </div>
  );
}
