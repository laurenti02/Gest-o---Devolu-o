import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessao, PERFIS_ADM } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_ADM.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { id, decisao } = await req.json();
  if (!["aprovado", "reprovado"].includes(decisao)) {
    return NextResponse.json({ erro: "Decisão inválida." }, { status: 400 });
  }

  const r = (await db.select().from(schema.refaturamentos).where(eq(schema.refaturamentos.id, Number(id))))[0];
  if (!r) return NextResponse.json({ erro: "Solicitação não encontrada." }, { status: 404 });
  if (r.status !== "aguardando_aprovacao") {
    return NextResponse.json({ erro: "Solicitação já foi decidida." }, { status: 409 });
  }

  await db.update(schema.refaturamentos)
    .set({
      status: decisao,
      etapaAtual: decisao === "aprovado" ? "logistica" : null,
      aprovadorEmail: sessao.email,
      aprovadorNome: sessao.nome,
      decisaoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    })
    .where(eq(schema.refaturamentos.id, r.id));

  await db.insert(schema.refaturamentoHistorico).values({
    refaturamentoId: r.id,
    usuario: sessao.nome,
    acao: `Solicitação ${decisao} pelo ADM`,
    comentario: null,
  });

  return NextResponse.json({ ok: true, statusFinal: decisao });
}
