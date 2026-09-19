import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessaoPlanner } from "@/lib/plannerAuth";
import { defaultPlannerData } from "@/lib/plannerDefaults";

export async function GET() {
  try {
    const sessao = await getSessaoPlanner();
    if (!sessao) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    let registro = (await db.select().from(schema.plannerDados).where(eq(schema.plannerDados.usuarioId, sessao.id)))[0];
    if (!registro) {
      await db.insert(schema.plannerDados).values({ usuarioId: sessao.id, dados: defaultPlannerData() });
      registro = (await db.select().from(schema.plannerDados).where(eq(schema.plannerDados.usuarioId, sessao.id)))[0];
    }
    return NextResponse.json(registro.dados);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar dados." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessao = await getSessaoPlanner();
    if (!sessao) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const dados = await req.json();
    if (!dados || typeof dados !== "object") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const existente = (await db.select().from(schema.plannerDados).where(eq(schema.plannerDados.usuarioId, sessao.id)))[0];
    if (existente) {
      await db.update(schema.plannerDados)
        .set({ dados, atualizadoEm: new Date().toISOString() })
        .where(eq(schema.plannerDados.usuarioId, sessao.id));
    } else {
      await db.insert(schema.plannerDados).values({ usuarioId: sessao.id, dados });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao salvar dados." }, { status: 500 });
  }
}
