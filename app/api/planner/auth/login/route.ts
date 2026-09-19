import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { criarSessaoPlanner } from "@/lib/plannerAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });

    const emailNorm = String(email).trim().toLowerCase();
    const user = (await db.select().from(schema.plannerUsuarios).where(eq(schema.plannerUsuarios.email, emailNorm)))[0];
    if (!user) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });

    const ok = await bcrypt.compare(password, user.senhaHash);
    if (!ok) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });

    await criarSessaoPlanner({ id: user.id, nome: user.nome, email: user.email });
    return NextResponse.json({ id: user.id, name: user.nome, email: user.email });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao entrar." }, { status: 500 });
  }
}
