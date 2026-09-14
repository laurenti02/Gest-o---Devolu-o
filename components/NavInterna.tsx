"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERFIS_ADM, PERFIS_APROVACAO, PERFIS_SETOR } from "@/lib/perfis";
import { PERFIS_REFATURAMENTO } from "@/lib/refaturamento-fluxo";

export function NavInterna({ perfil }: { perfil: string }) {
  const pathname = usePathname();
  const links: { href: string; label: string }[] = [];

  if (PERFIS_ADM.includes(perfil)) {
    links.push({ href: "/admin", label: "Painel ADM" });
  }
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

  return (
    <nav className="flex gap-1 max-w-6xl mx-auto px-4 pt-3 text-sm">
      {links.map((l) => {
        const ativo = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 rounded-t font-medium"
            style={
              ativo
                ? { background: "#fff", color: "var(--ntk-preto)", border: "1px solid var(--ntk-borda)", borderBottom: "1px solid #fff" }
                : { color: "var(--ntk-preto-suave)" }
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
