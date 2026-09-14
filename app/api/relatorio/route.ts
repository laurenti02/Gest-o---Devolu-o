import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/fluxo";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const todas = await db.select().from(schema.solicitacoes);
  const aprovacoes = await db.select().from(schema.aprovacoes);

  const totalSolicitacoes = todas.length;
  const aprovadas = todas.filter((s) => s.status !== "aguardando_aprovacao" && s.status !== "reprovado");
  const reprovadas = todas.filter((s) => s.status === "reprovado");
  const pendentes = todas.filter((s) => s.status === "aguardando_aprovacao");
  const valorAprovado = aprovadas.reduce((acc, s) => acc + s.valor, 0);

  const linhas = todas.map((s) => {
    const decisoesSolic = aprovacoes.filter((a) => a.solicitacaoId === s.id);
    return {
      protocolo: s.protocolo,
      empresa: s.empresa,
      cnpj: s.cnpj,
      valor: s.valor,
      status: s.status,
      statusLabel: STATUS_LABEL[s.status] ?? s.status,
      etapaAtual: s.etapaAtual,
      criadoEm: s.criadoEm,
      decisoes: decisoesSolic.map((d) => ({
        aprovador: d.aprovadorNome,
        decisao: d.decisao,
        comentario: d.comentario,
        data: d.criadoEm,
      })),
    };
  });

  return NextResponse.json({
    resumo: {
      totalSolicitacoes,
      totalAprovadas: aprovadas.length,
      totalReprovadas: reprovadas.length,
      totalPendentes: pendentes.length,
      valorAprovado,
    },
    linhas,
  });
}

// Salva snapshot do relatório no histórico (equivalente ao snapshot Dataverse RELATORIO-APROVACOES)
export async function POST() {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const todas = await db.select().from(schema.solicitacoes);
  const resumo = {
    total: todas.length,
    aprovadas: todas.filter((s) => s.status !== "aguardando_aprovacao" && s.status !== "reprovado").length,
    reprovadas: todas.filter((s) => s.status === "reprovado").length,
    pendentes: todas.filter((s) => s.status === "aguardando_aprovacao").length,
    valorAprovado: todas
      .filter((s) => s.status !== "aguardando_aprovacao" && s.status !== "reprovado")
      .reduce((acc, s) => acc + s.valor, 0),
    geradoEm: new Date().toISOString(),
    geradoPor: sessao.nome,
  };

  // solicitacaoId nulo = marcador de snapshot geral (registro em historico)
  await db.insert(schema.historico)
    .values({
      solicitacaoId: null,
      usuario: sessao.nome,
      acao: "RELATORIO-APROVACOES",
      comentario: JSON.stringify(resumo),
    });

  return NextResponse.json({ ok: true, snapshot: resumo });
}
