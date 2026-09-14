import { redirect } from "next/navigation";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TopoInterno } from "@/components/TopoInterno";
import { NavInterna } from "@/components/NavInterna";
import { ListaAprovacoes } from "./ListaAprovacoes";

export default async function PaginaAprovacoes() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/aprovacoes");
  if (!PERFIS_APROVACAO.includes(sessao.perfil)) redirect("/admin");

  const pendentes = await db
    .select()
    .from(schema.solicitacoes)
    .where(eq(schema.solicitacoes.status, "aguardando_aprovacao"));

  const comDecisoes = await Promise.all(
    pendentes.map(async (s) => {
      const decisoes = await db.select().from(schema.aprovacoes).where(eq(schema.aprovacoes.solicitacaoId, s.id));
      return { ...s, decisoes };
    })
  );

  return (
    <>
      <TopoInterno nome={sessao.nome} perfil={sessao.perfil} subtitulo="Aprovações" />
      <NavInterna perfil={sessao.perfil} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ background: "var(--ntk-osso)" }}>
        <h1 className="font-display text-2xl font-bold mb-1">Fila de aprovações</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Governança obrigatória: cada solicitação só avança após aprovação da Diretoria e do Gerente.
        </p>
        <ListaAprovacoes solicitacoesIniciais={comDecisoes} emailUsuario={sessao.email} />
      </main>
    </>
  );
}
