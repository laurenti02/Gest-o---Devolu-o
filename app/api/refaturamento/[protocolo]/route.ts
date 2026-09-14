import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { STATUS_LABEL, ETAPA_LABEL } from "@/lib/refaturamento-fluxo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ protocolo: string }> }
) {
  const { protocolo } = await params;

  const r = (
    await db.select().from(schema.refaturamentos).where(eq(schema.refaturamentos.protocolo, protocolo.toUpperCase()))
  )[0];

  if (!r) {
    return NextResponse.json({ erro: "Protocolo não encontrado." }, { status: 404 });
  }

  // Visão pública: sem e-mails de aprovador, chaves fiscais ou comentários internos
  return NextResponse.json({
    protocolo: r.protocolo,
    clienteOriginal: r.clienteOriginal,
    valor: r.valor,
    status: r.status,
    statusLabel: STATUS_LABEL[r.status] ?? r.status,
    etapaAtual: r.etapaAtual,
    etapaLabel: r.etapaAtual ? ETAPA_LABEL[r.etapaAtual] ?? r.etapaAtual : null,
    criadoEm: r.criadoEm,
  });
}
