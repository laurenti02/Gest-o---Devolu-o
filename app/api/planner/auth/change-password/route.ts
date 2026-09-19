import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessaoPlanner } from "@/lib/plannerAuth";

export async function POST(req: NextRequest) {
  try {
    const sessao = await getSessaoPlanner();
    if (!sessao) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const user = (await db.select().from(schema.plannerUsuarios).where(eq(schema.plannerUsuarios.id, sessao.id)))[0];
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const ok = await bcrypt.compare(currentPassword || "", user.senhaHash);
    if (!ok) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });

    const senhaHash = await bcrypt.hash(newPassword, 10);
    await db.update(schema.plannerUsuarios).set({ senhaHash }).where(eq(schema.plannerUsuarios.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao trocar senha." }, { status: 500 });
  }
}
