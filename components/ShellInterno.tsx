"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { PERFIS_ADM, PERFIS_APROVACAO, PERFIS_SETOR } from "@/lib/perfis";
import { PERFIS_REFATURAMENTO } from "@/lib/refaturamento-fluxo";
import { SETOR_LABEL } from "@/lib/fluxo";

// Estrutura das telas internas, no mesmo estilo do Planner:
// menu lateral escuro à esquerda + topo branco com título e data.
export function ShellInterno({
  nome,
  perfil,
  subtitulo,
  children,
}: {
  nome: string;
  perfil: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hoje, setHoje] = useState("");

  useEffect(() => {
    setHoje(
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links: { href: string; label: string }[] = [];
  if (PERFIS_ADM.includes(perfil)) links.push({ href: "/admin", label: "Painel ADM" });
  if (PERFIS_APROVACAO.includes(perfil)) {
    links.push({ href: "/aprovacoes", label: "Aprovações" });
    links.push({ href: "/relatorio", label: "Relatório" });
  }
  if (PERFIS_SETOR.includes(perfil) || PERFIS_ADM.includes(perfil)) {
    links.push({ href: "/setor", label: "Painel do setor" });
  }
  if (PERFIS_ADM.includes(perfil)) {
    links.push({ href: "/refaturamento/aprovacoes", label: "Refaturamento · Aprovações" });
  }
  if (PERFIS_REFATURAMENTO.includes(perfil)) {
    links.push({ href: "/refaturamento/painel", label: "Refaturamento · Painel" });
  }
  links.push({ href: "/planner", label: "Planner" });

  return (
    <div className="ntk-app">
      <aside className="ntk-side">
        <div className="ntk-side-brand">
          <div className="ntk-side-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nautika.png" alt="Grupo Nautika" />
          </div>
          <div className="ntk-side-mark">Devoluções</div>
          <div className="ntk-side-title">Controle de Solicitações</div>
        </div>

        <nav className="ntk-side-nav">
          {links.map((l) => {
            const ativo = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className="ntk-side-link"
                aria-current={ativo ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ntk-side-foot">
          <div className="ntk-side-user">
            <span className="ntk-side-dot" />
            {nome}
          </div>
          <div className="ntk-side-role">{SETOR_LABEL[perfil] || perfil}</div>
          <button onClick={sair} className="ntk-side-sair">
            Sair
          </button>
        </div>
      </aside>

      <div className="ntk-content">
        <header className="ntk-topbar">
          <div>
            <div className="ntk-topbar-title">{subtitulo}</div>
            <div className="ntk-topbar-date">{hoje || " "}</div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
