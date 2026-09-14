"use client";

import { useState } from "react";

export function BotoesDownload() {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function salvarSnapshot() {
    setSalvando(true);
    setMensagem(null);
    try {
      const resp = await fetch("/api/relatorio", { method: "POST" });
      const json = await resp.json();
      if (resp.ok) {
        setMensagem("Snapshot salvo no histórico (RELATORIO-APROVACOES).");
      } else {
        setMensagem(json.erro || "Falha ao salvar snapshot.");
      }
    } catch {
      setMensagem("Falha de conexão ao salvar snapshot.");
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap justify-end">
        <a href="/api/relatorio/csv" className="ntk-btn-outline px-4 py-2 text-sm">
          Baixar CSV
        </a>
        <a href="/api/relatorio/excel" className="ntk-btn-outline px-4 py-2 text-sm">
          Baixar Excel
        </a>
        <button onClick={salvarSnapshot} disabled={salvando} className="ntk-btn-primary px-4 py-2 text-sm">
          {salvando ? "Salvando..." : "Salvar snapshot"}
        </button>
      </div>
      {mensagem && <p className="text-xs text-neutral-500">{mensagem}</p>}
    </div>
  );
}
