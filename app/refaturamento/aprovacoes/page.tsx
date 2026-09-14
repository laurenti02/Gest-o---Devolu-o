import { redirect } from "next/navigation";
import { getSessao, PERFIS_ADM } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TopoInterno } from "@/components/TopoInterno";
import { NavInterna } from "@/components/NavInterna";
import { ListaAprovacoesRefaturamento } from "./ListaAprovacoesRefaturamento";

export default async function PaginaAprovacoesRefaturamento() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/refaturamento/aprovacoes");
  if (!PERFIS_ADM.includes(sessao.perfil)) redirect("/admin");

  const pendentes = await db
    .select()
    .from(schema.refaturamentos)
    .where(eq(schema.refaturamentos.status, "aguardando_aprovacao"));

  return (
    <>
      <TopoInterno nome={sessao.nome} perfil={sessao.perfil} subtitulo="Refaturamento · Aprovações" />
      <NavInterna perfil={sessao.perfil} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ background: "var(--ntk-osso)" }}>
        <h1 className="font-display text-2xl font-bold mb-1">Aprovações de refaturamento</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Ao aprovar, a solicitação segue automaticamente para a Logística.
        </p>
        <ListaAprovacoesRefaturamento solicitacoesIniciais={pendentes} />
      </main>
    </>
  );
}
