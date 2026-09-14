import { redirect } from "next/navigation";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/fluxo";
import { TopoInterno } from "@/components/TopoInterno";
import { NavInterna } from "@/components/NavInterna";
import { BotoesDownload } from "./BotoesDownload";

export default async function PaginaRelatorio() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login?redirect=/relatorio");
  if (!PERFIS_APROVACAO.includes(sessao.perfil)) redirect("/admin");

  const todas = await db.select().from(schema.solicitacoes);
  const aprovacoes = await db.select().from(schema.aprovacoes);

  const aprovadas = todas.filter((s) => s.status !== "aguardando_aprovacao" && s.status !== "reprovado");
  const reprovadas = todas.filter((s) => s.status === "reprovado");
  const pendentes = todas.filter((s) => s.status === "aguardando_aprovacao");
  const valorAprovado = aprovadas.reduce((acc, s) => acc + s.valor, 0);

  return (
    <>
      <TopoInterno nome={sessao.nome} perfil={sessao.perfil} subtitulo="Relatório de aprovações" />
      <NavInterna perfil={sessao.perfil} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full" style={{ background: "var(--ntk-osso)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Relatório de aprovações</h1>
            <p className="text-sm text-neutral-600">
              Consolidado de solicitações, decisões e valores para auditoria ou comunicação operacional.
            </p>
          </div>
          <BotoesDownload />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <CardIndicador rotulo="Total de solicitações" valor={todas.length} />
          <CardIndicador rotulo="Aprovadas" valor={aprovadas.length} cor="var(--ntk-verde)" />
          <CardIndicador rotulo="Reprovadas" valor={reprovadas.length} cor="var(--ntk-vermelho)" />
          <CardIndicador rotulo="Pendentes" valor={pendentes.length} cor="var(--ntk-laranja-forte)" />
        </div>

        <div className="ntk-card p-5 mb-8">
          <p className="text-sm text-neutral-500 mb-1">Valor total aprovado</p>
          <p className="font-display text-3xl font-bold">
            {valorAprovado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        <div className="ntk-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--ntk-borda)" }}>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Protocolo</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Empresa</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Valor</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Status</th>
                <th className="p-3 font-mono text-xs uppercase text-neutral-500">Decisões</th>
              </tr>
            </thead>
            <tbody>
              {todas.map((s) => {
                const decisoesSolic = aprovacoes.filter((a) => a.solicitacaoId === s.id);
                return (
                  <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--ntk-borda)" }}>
                    <td className="p-3 font-mono">{s.protocolo}</td>
                    <td className="p-3">{s.empresa}</td>
                    <td className="p-3">{s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="p-3">{STATUS_LABEL[s.status] ?? s.status}</td>
                    <td className="p-3 text-xs text-neutral-500">
                      {decisoesSolic.length === 0
                        ? "—"
                        : decisoesSolic.map((d) => `${d.aprovadorNome}: ${d.decisao}`).join(" · ")}
                    </td>
                  </tr>
                );
              })}
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

function CardIndicador({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div className="ntk-card p-4">
      <p className="text-xs text-neutral-500 mb-1">{rotulo}</p>
      <p className="font-display text-2xl font-bold" style={{ color: cor || "var(--ntk-preto)" }}>
        {valor}
      </p>
    </div>
  );
}
