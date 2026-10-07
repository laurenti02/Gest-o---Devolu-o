import { redirect } from "next/navigation";
import { getSessao, PERFIS_ADM } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { PERFIL_ETAPA, ETAPA_LABEL } from "@/lib/refaturamento-fluxo";
import { ShellInterno } from "@/components/ShellInterno";
import { PainelRefaturamentoCliente } from "./PainelRefaturamentoCliente";

export default async function PainelRefaturamento() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/refaturamento/painel");

  const isAdmin = PERFIS_ADM.includes(sessao.perfil);
  const minhaEtapa = PERFIL_ETAPA[sessao.perfil];
  if (!isAdmin && !minhaEtapa) redirect("/admin");

  const listaBruta = isAdmin
    ? await db.select().from(schema.refaturamentos).where(eq(schema.refaturamentos.status, "aprovado"))
    : await db
        .select()
        .from(schema.refaturamentos)
        .where(and(eq(schema.refaturamentos.status, "aprovado"), eq(schema.refaturamentos.etapaAtual, minhaEtapa)));
  const lista = listaBruta.map((r) => ({ ...r, etapaAtual: r.etapaAtual ?? "concluido" }));

  return (
    <>
      <ShellInterno
        nome={sessao.nome}
        perfil={sessao.perfil}
        subtitulo={`Refaturamento · ${isAdmin ? "Todas as etapas" : ETAPA_LABEL[minhaEtapa]}`}
      >
      <div className="ntk-view">
        <h1 className="font-display text-2xl font-bold mb-1">
          {isAdmin ? "Refaturamento — todas as etapas" : `Refaturamento — ${ETAPA_LABEL[minhaEtapa]}`}
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Solicitações aprovadas, agrupadas pela etapa atual do fluxo.
        </p>
        <PainelRefaturamentoCliente listaInicial={lista} perfil={sessao.perfil} isAdmin={isAdmin} />
      </div>
      </ShellInterno>
    </>
  );
}
