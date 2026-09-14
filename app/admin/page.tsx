import { redirect } from "next/navigation";
import { getSessao, PERFIS_ADM, PERFIS_APROVACAO } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { STATUS_LABEL, SETOR_LABEL, estaAtrasado } from "@/lib/fluxo";
import { TopoInterno } from "@/components/TopoInterno";
import { NavInterna } from "@/components/NavInterna";
import Link from "next/link";

export default async function PainelAdmin() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/admin");
  if (!PERFIS_ADM.includes(sessao.perfil)) {
    redirect(PERFIS_APROVACAO.includes(sessao.perfil) ? "/aprovacoes" : "/setor");
  }

  const todas = await db.select().from(schema.solicitacoes);
  const etapas = await db.select().from(schema.etapas);

  const emAndamento = todas.filter((s) => s.status === "em_andamento");
  const aguardandoNfd = todas.filter((s) => s.status === "aprovado");
  const atrasadas = etapas.filter((e) => estaAtrasado(e.prazoLimite, e.status));

  return (
    <>
      <TopoInterno nome={sessao.nome} perfil={sessao.perfil} subtitulo="Painel ADM" />
      <NavInterna perfil={sessao.perfil} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ background: "var(--ntk-osso)" }}>
        <h1 className="font-display text-2xl font-bold mb-1">Visão geral</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Acompanhamento completo do processo após as aprovações obrigatórias.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Indicador rotulo="Total" valor={todas.length} />
          <Indicador rotulo="Aguardando NFD" valor={aguardandoNfd.length} cor="var(--ntk-laranja-forte)" />
          <Indicador rotulo="Em andamento" valor={emAndamento.length} cor="var(--ntk-verde)" />
          <Indicador rotulo="Etapas atrasadas" valor={atrasadas.length} cor="var(--ntk-vermelho)" />
        </div>

        <div className="ntk-card p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-display font-bold">Refaturamento</p>
            <p className="text-xs text-neutral-500">Aprovações e acompanhamento por etapa (Logística → Fiscal → Financeiro)</p>
          </div>
          <div className="flex gap-2">
            <Link href="/refaturamento/aprovacoes" className="ntk-btn-outline px-3 py-1.5 text-xs">Aprovações</Link>
            <Link href="/refaturamento/painel" className="ntk-btn-primary px-3 py-1.5 text-xs">Painel</Link>
          </div>
        </div>

        <div className="ntk-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--ntk-borda)" }}>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Protocolo</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Empresa</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Status</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Etapa atual</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {todas.map((s) => (
                <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--ntk-borda)" }}>
                  <td className="p-3 font-mono">{s.protocolo}</td>
                  <td className="p-3">{s.empresa}</td>
                  <td className="p-3">{STATUS_LABEL[s.status] ?? s.status}</td>
                  <td className="p-3">{s.etapaAtual ? SETOR_LABEL[s.etapaAtual] ?? s.etapaAtual : "—"}</td>
                  <td className="p-3">{s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                </tr>
              ))}
              {todas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">
                    Nenhuma solicitação registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Indicador({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div className="ntk-card p-4">
      <p className="text-xs text-neutral-500 mb-1">{rotulo}</p>
      <p className="font-display text-2xl font-bold" style={{ color: cor || "var(--ntk-preto)" }}>
        {valor}
      </p>
    </div>
  );
}
