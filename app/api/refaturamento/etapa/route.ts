import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessao, PERFIS_ADM } from "@/lib/auth";
import { PERFIL_ETAPA } from "@/lib/refaturamento-fluxo";

export async function POST(req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  const r = (await db.select().from(schema.refaturamentos).where(eq(schema.refaturamentos.id, Number(id))))[0];
  if (!r) return NextResponse.json({ erro: "Solicitação não encontrada." }, { status: 404 });
  if (r.status !== "aprovado") return NextResponse.json({ erro: "Solicitação ainda não aprovada." }, { status: 409 });

  const minhaEtapa = PERFIL_ETAPA[sessao.perfil];
  const isAdmin = PERFIS_ADM.includes(sessao.perfil);
  if (!isAdmin && minhaEtapa !== r.etapaAtual) {
    return NextResponse.json({ erro: "Você não tem acesso a esta etapa." }, { status: 403 });
  }

  const agora = new Date().toISOString();

  if (r.etapaAtual === "logistica") {
    const { tipoRegularizacao, comentario } = body;
    if (!tipoRegularizacao) return NextResponse.json({ erro: "Informe o tipo de regularização." }, { status: 400 });
    await db.update(schema.refaturamentos).set({
      logTipoRegularizacao: tipoRegularizacao,
      logComentario: comentario || null,
      logConcluidoEm: agora,
      logConcluidoPor: sessao.nome,
      etapaAtual: "fiscal",
      atualizadoEm: agora,
    }).where(eq(schema.refaturamentos.id, r.id));
    await db.insert(schema.refaturamentoHistorico).values({
      refaturamentoId: r.id, usuario: sessao.nome,
      acao: `Mercadoria regularizada (${tipoRegularizacao}) — enviado para Fiscal`, comentario: comentario || null,
    });
  } else if (r.etapaAtual === "fiscal") {
    const { chaveNfEntrada, precisaSefaz, protocoloSefaz, chaveNovaNfe, comentario } = body;
    if (!chaveNfEntrada || !chaveNovaNfe) {
      return NextResponse.json({ erro: "Preencha as chaves obrigatórias." }, { status: 400 });
    }
    await db.update(schema.refaturamentos).set({
      fiscalChaveNfEntrada: chaveNfEntrada,
      fiscalPrecisaSefaz: !!precisaSefaz,
      fiscalProtocoloSefaz: protocoloSefaz || null,
      fiscalChaveNovaNfe: chaveNovaNfe,
      fiscalComentario: comentario || null,
      fiscalConcluidoEm: agora,
      fiscalConcluidoPor: sessao.nome,
      etapaAtual: "financeiro",
      atualizadoEm: agora,
    }).where(eq(schema.refaturamentos.id, r.id));
    await db.insert(schema.refaturamentoHistorico).values({
      refaturamentoId: r.id, usuario: sessao.nome,
      acao: "Documentos fiscais emitidos — enviado para Financeiro", comentario: comentario || null,
    });
  } else if (r.etapaAtual === "financeiro") {
    const { comentario } = body;
    await db.update(schema.refaturamentos).set({
      finComentario: comentario || null,
      finConcluidoEm: agora,
      finConcluidoPor: sessao.nome,
      etapaAtual: "concluido",
      atualizadoEm: agora,
    }).where(eq(schema.refaturamentos.id, r.id));
    await db.insert(schema.refaturamentoHistorico).values({
      refaturamentoId: r.id, usuario: sessao.nome,
      acao: "Processo de refaturamento concluído", comentario: comentario || null,
    });
  } else {
    return NextResponse.json({ erro: "Etapa atual não reconhecida." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
