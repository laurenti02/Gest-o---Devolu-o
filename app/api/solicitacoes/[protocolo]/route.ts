import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { STATUS_LABEL } from "@/lib/fluxo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ protocolo: string }> }
) {
  const { protocolo } = await params;

  const solicitacao = (
    await db
      .select()
      .from(schema.solicitacoes)
      .where(eq(schema.solicitacoes.protocolo, protocolo.toUpperCase()))
  )[0];

  if (!solicitacao) {
    return NextResponse.json({ erro: "Protocolo não encontrado." }, { status: 404 });
  }

  const anexo = (
    await db
      .select()
      .from(schema.anexosNf)
      .where(eq(schema.anexosNf.solicitacaoId, solicitacao.id))
  )[0];

  // Visão pública: sem nomes de aprovadores, comentários internos, setores ou indicadores
  return NextResponse.json({
    protocolo: solicitacao.protocolo,
    empresa: solicitacao.empresa,
    valor: solicitacao.valor,
    status: solicitacao.status,
    statusLabel: STATUS_LABEL[solicitacao.status] ?? solicitacao.status,
    criadoEm: solicitacao.criadoEm,
    podeAnexarNf: solicitacao.status !== "aguardando_aprovacao" && solicitacao.status !== "reprovado" && !anexo,
    nfJaAnexada: Boolean(anexo),
  });
}
