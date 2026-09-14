import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const pendentes = await db
    .select()
    .from(schema.solicitacoes)
    .where(eq(schema.solicitacoes.status, "aguardando_aprovacao"));

  const comAprovacoes = await Promise.all(
    pendentes.map(async (s) => {
      const decisoes = await db
        .select()
        .from(schema.aprovacoes)
        .where(eq(schema.aprovacoes.solicitacaoId, s.id));
      return { ...s, decisoes };
    })
  );

  return NextResponse.json({ solicitacoes: comAprovacoes });
}

export async function POST(req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { solicitacaoId, decisao, comentario } = await req.json();
  if (!["aprovado", "reprovado"].includes(decisao)) {
    return NextResponse.json({ erro: "Decisão inválida." }, { status: 400 });
  }

  const solicitacao = (
    await db
      .select()
      .from(schema.solicitacoes)
      .where(eq(schema.solicitacoes.id, Number(solicitacaoId)))
  )[0];

  if (!solicitacao) {
    return NextResponse.json({ erro: "Solicitação não encontrada." }, { status: 404 });
  }
  if (solicitacao.status !== "aguardando_aprovacao") {
    return NextResponse.json({ erro: "Solicitação já foi decidida." }, { status: 409 });
  }

  // evita duplo voto do mesmo usuário
  const jaVotou = (
    await db
      .select()
      .from(schema.aprovacoes)
      .where(
        and(
          eq(schema.aprovacoes.solicitacaoId, solicitacao.id),
          eq(schema.aprovacoes.aprovadorEmail, sessao.email)
        )
      )
  )[0];
  if (jaVotou) {
    return NextResponse.json({ erro: "Você já registrou uma decisão para esta solicitação." }, { status: 409 });
  }

  await db.insert(schema.aprovacoes)
    .values({
      solicitacaoId: solicitacao.id,
      aprovadorEmail: sessao.email,
      aprovadorNome: sessao.nome,
      decisao,
      comentario: comentario || null,
    });

  await db.insert(schema.historico)
    .values({
      solicitacaoId: solicitacao.id,
      usuario: sessao.nome,
      acao: `Decisão de aprovação: ${decisao}`,
      comentario: comentario || null,
    });

  if (decisao === "reprovado") {
    await db.update(schema.solicitacoes)
      .set({ status: "reprovado", atualizadoEm: new Date().toISOString() })
      .where(eq(schema.solicitacoes.id, solicitacao.id));
    return NextResponse.json({ ok: true, statusFinal: "reprovado" });
  }

  // governança obrigatória: precisa de aprovação de Diretoria E Gerente (ADM conta como reforço, não substitui)
  const decisoes = await db
    .select()
    .from(schema.aprovacoes)
    .where(eq(schema.aprovacoes.solicitacaoId, solicitacao.id));

  const perfilPorEmail = new Map<string, string>();
  const usuarios = await db.select().from(schema.usuarios);
  for (const u of usuarios) perfilPorEmail.set(u.email, u.perfil);

  const aprovouDiretoria = decisoes.some(
    (d) => d.decisao === "aprovado" && perfilPorEmail.get(d.aprovadorEmail) === "diretoria"
  );
  const aprovouGerente = decisoes.some(
    (d) => d.decisao === "aprovado" && perfilPorEmail.get(d.aprovadorEmail) === "gerente"
  );

  if (aprovouDiretoria && aprovouGerente) {
    await db.update(schema.solicitacoes)
      .set({ status: "aprovado", etapaAtual: "aguardando_nfd", atualizadoEm: new Date().toISOString() })
      .where(eq(schema.solicitacoes.id, solicitacao.id));
    return NextResponse.json({ ok: true, statusFinal: "aprovado" });
  }

  return NextResponse.json({ ok: true, statusFinal: "aguardando_aprovacao" });
}
