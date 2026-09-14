"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarcaNTK } from "./MarcaNTK";
import { SETOR_LABEL } from "@/lib/fluxo";

export function TopoInterno({
  nome,
  perfil,
  subtitulo,
}: {
  nome: string;
  perfil: string;
  subtitulo: string;
}) {
  const router = useRouter();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b" style={{ borderColor: "var(--ntk-borda)", background: "#fff" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin">
          <MarcaNTK subtitulo={subtitulo} />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right leading-tight hidden sm:block">
            <div className="font-medium">{nome}</div>
            <div className="text-xs text-neutral-500">{SETOR_LABEL[perfil] || perfil}</div>
          </div>
          <button onClick={sair} className="ntk-btn-outline px-3 py-1.5 text-xs">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
