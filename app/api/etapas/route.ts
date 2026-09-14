import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessao, PERFIS_SETOR, PERFIS_ADM } from "@/lib/auth";
import { ETAPAS_FLUXO, calcularPrazoLimite } from "@/lib/fluxo";

// GET: lista etapas do setor do usuário logado (ou todas, se admin)
export async function GET(req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const setorParam = searchParams.get("setor");

  let setor = sessao.perfil;
  if (PERFIS_ADM.includes(sessao.perfil) && setorParam) {
    setor = setorParam;
  } else if (!PERFIS_SETOR.includes(sessao.perfil) && !PERFIS_ADM.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Perfil sem painel de setor." }, { status: 403 });
  }

  const linhaFluxo = ETAPAS_FLUXO.find((e) => e.setor === setor);
  if (!linhaFluxo && !PERFIS_ADM.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Setor inválido." }, { status: 400 });
  }

  const etapasSetor = setor
    ? await db.select().from(schema.etapas).where(eq(schema.etapas.setor, setor))
    : await db.select().from(schema.etapas);

  const comSolicitacao = await Promise.all(
    etapasSetor.map(async (e) => {
      const solicitacao = (
        await db
          .select()
          .from(schema.solicitacoes)
          .where(eq(schema.solicitacoes.id, e.solicitacaoId))
      )[0];
      return { ...e, solicitacao };
    })
  );

  return NextResponse.json({ etapas: comSolicitacao });
}

// POST: atualiza status/comentário de uma etapa e, se concluída, libera a próxima
export async function POST(req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const { etapaId, status, comentario } = await req.json();
  if (!["em_andamento", "concluido", "bloqueado"].includes(status)) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  const etapa = (
    await db.select().from(schema.etapas).where(eq(schema.etapas.id, Number(etapaId)))
  )[0];
  if (!etapa) return NextResponse.json({ erro: "Etapa não encontrada." }, { status: 404 });

  if (!PERFIS_ADM.includes(sessao.perfil) && sessao.perfil !== etapa.setor) {
    return NextResponse.json({ erro: "Você não tem acesso a esta etapa." }, { status: 403 });
  }

  await db.update(schema.etapas)
    .set({
      status,
      comentario: comentario ?? etapa.comentario,
      responsavel: sessao.nome,
      concluidoEm: status === "concluido" ? new Date().toISOString() : etapa.concluidoEm,
    })
    .where(eq(schema.etapas.id, etapa.id));

  await db.insert(schema.historico)
    .values({
      solicitacaoId: etapa.solicitacaoId,
      usuario: sessao.nome,
      acao: `Etapa ${etapa.setor}: ${status}`,
      comentario: comentario || null,
    });

  if (status === "concluido") {
    const proxima = ETAPAS_FLUXO.find((e) => e.ordem === etapa.ordem + 1);
    if (proxima) {
      await db.insert(schema.etapas)
        .values({
          solicitacaoId: etapa.solicitacaoId,
          setor: proxima.setor,
          ordem: proxima.ordem,
          status: "pendente",
          prazoHorasUteis: proxima.prazoHorasUteis,
          prazoLimite: calcularPrazoLimite(proxima.prazoHorasUteis),
        });
      await db.update(schema.solicitacoes)
        .set({ etapaAtual: proxima.setor, atualizadoEm: new Date().toISOString() })
        .where(eq(schema.solicitacoes.id, etapa.solicitacaoId));
    } else {
      await db.update(schema.solicitacoes)
        .set({ status: "concluido", etapaAtual: "concluido", atualizadoEm: new Date().toISOString() })
        .where(eq(schema.solicitacoes.id, etapa.solicitacaoId));
    }
  }

  return NextResponse.json({ ok: true });
}
