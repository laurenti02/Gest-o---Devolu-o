import { redirect } from "next/navigation";
import { getSessao, PERFIS_SETOR, PERFIS_ADM } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SETOR_LABEL, estaAtrasado } from "@/lib/fluxo";
import { TopoInterno } from "@/components/TopoInterno";
import { NavInterna } from "@/components/NavInterna";
import { PainelSetorCliente } from "./PainelSetorCliente";

export default async function PainelSetor() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/setor");
  if (!PERFIS_SETOR.includes(sessao.perfil) && !PERFIS_ADM.includes(sessao.perfil)) redirect("/admin");

  const setor = PERFIS_ADM.includes(sessao.perfil) ? null : sessao.perfil;

  const etapasSetor = setor
    ? await db.select().from(schema.etapas).where(eq(schema.etapas.setor, setor))
    : await db.select().from(schema.etapas);

  const comSolicitacao = await Promise.all(
    etapasSetor.map(async (e) => {
      const solicitacao = (
        await db.select().from(schema.solicitacoes).where(eq(schema.solicitacoes.id, e.solicitacaoId))
      )[0];
      return { ...e, solicitacao, atrasado: estaAtrasado(e.prazoLimite, e.status) };
    })
  );

  return (
    <>
      <TopoInterno nome={sessao.nome} perfil={sessao.perfil} subtitulo={setor ? SETOR_LABEL[setor] : "Todos os setores"} />
      <NavInterna perfil={sessao.perfil} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ background: "var(--ntk-osso)" }}>
        <h1 className="font-display text-2xl font-bold mb-1">
          {setor ? `Painel — ${SETOR_LABEL[setor]}` : "Painel — todos os setores"}
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Pendências, prazos e liberação da próxima etapa do fluxo de devolução.
        </p>
        <PainelSetorCliente etapasIniciais={comSolicitacao} />
      </main>
    </>
  );
}
