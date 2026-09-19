import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessaoPlanner } from "@/lib/plannerAuth";

export async function GET() {
  const sessao = await getSessaoPlanner();
  if (!sessao) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = (await db.select().from(schema.plannerUsuarios).where(eq(schema.plannerUsuarios.id, sessao.id)))[0];
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  return NextResponse.json({ id: user.id, name: user.nome, email: user.email });
}
