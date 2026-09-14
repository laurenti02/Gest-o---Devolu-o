"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarcaNTK } from "@/components/MarcaNTK";
import { PERFIS_ADM, PERFIS_APROVACAO, PERFIS_SETOR } from "@/lib/perfis";

function destinoPorPerfil(perfil: string): string {
  if (perfil === "logistica") return "/refaturamento/painel"; // perfil exclusivo do Refaturamento
  if (PERFIS_ADM.includes(perfil)) return "/admin";
  if (PERFIS_APROVACAO.includes(perfil)) return "/aprovacoes";
  if (PERFIS_SETOR.includes(perfil)) return "/setor";
  return "/admin";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectParam = params.get("redirect");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Não foi possível entrar.");
        return;
      }
      const destino = redirectParam || destinoPorPerfil(json.perfil);
      router.push(destino);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4" style={{ background: "var(--ntk-osso)" }}>
      <div className="ntk-card p-8 max-w-sm w-full">
        <MarcaNTK subtitulo="Acesso interno" />
        <h1 className="font-display text-2xl font-bold mt-6 mb-1">Entrar</h1>
        <p className="text-sm text-neutral-600 mb-6">Aprovadores, ADM e setores operacionais.</p>
        <form onSubmit={entrar} className="flex flex-col gap-3">
          <input
            className="ntk-input"
            type="email"
            placeholder="e-mail corporativo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="ntk-input"
            type="password"
            placeholder="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && (
            <div className="text-sm px-3 py-2 rounded" style={{ background: "#fbe9e5", color: "var(--ntk-vermelho)" }}>
              {erro}
            </div>
          )}
          <button type="submit" disabled={enviando} className="ntk-btn-primary py-3 text-sm">
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
