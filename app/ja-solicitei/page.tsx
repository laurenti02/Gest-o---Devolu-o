"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { MarcaNTK } from "@/components/MarcaNTK";

export default function JaSolicitei() {
  const [protocolo, setProtocolo] = useState("");

  function buscar(e: FormEvent) {
    e.preventDefault();
    const p = protocolo.trim().toUpperCase();
    if (p) window.location.href = `/protocolo/${p}`;
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4" style={{ background: "var(--ntk-osso)" }}>
      <div className="ntk-card p-8 max-w-md w-full">
        <MarcaNTK subtitulo="Controle de Devoluções" />
        <h1 className="font-display text-2xl font-bold mt-6 mb-1">Já solicitei</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Informe o número do protocolo para consultar o andamento ou anexar a NF de devolução.
        </p>
        <form onSubmit={buscar} className="flex flex-col gap-3">
          <input
            className="ntk-input"
            placeholder="DEV-2026-000123"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            autoFocus
          />
          <button className="ntk-btn-primary py-3 text-sm">Consultar protocolo</button>
        </form>
        <Link href="/" className="text-sm underline underline-offset-4 mt-5 inline-block" style={{ color: "var(--ntk-laranja-forte)" }}>
          ← Voltar ao formulário
        </Link>
      </div>
    </main>
  );
}
