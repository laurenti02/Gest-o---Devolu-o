import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { criarSessaoPlanner } from "@/lib/plannerAuth";
import { defaultPlannerData } from "@/lib/plannerDefaults";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !String(name).trim()) return NextResponse.json({ error: "Digite seu nome." }, { status: 400 });
    if (!email || !EMAIL_RE.test(String(email).trim())) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    if (!password || String(password).length < 6) return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });

    const emailNorm = String(email).trim().toLowerCase();
    const existente = (await db.select().from(schema.plannerUsuarios).where(eq(schema.plannerUsuarios.email, emailNorm)))[0];
    if (existente) return NextResponse.json({ error: "Já existe uma conta com esse e-mail." }, { status: 409 });

    const senhaHash = await bcrypt.hash(password, 10);
    const inserted = await db.insert(schema.plannerUsuarios).values({
      nome: String(name).trim(),
      email: emailNorm,
      senhaHash,
    });
    const userId = Number(inserted.lastInsertRowid);

    await db.insert(schema.plannerDados).values({
      usuarioId: userId,
      dados: defaultPlannerData(),
    });

    const user = { id: userId, nome: String(name).trim(), email: emailNorm };
    await criarSessaoPlanner(user);
    return NextResponse.json({ id: user.id, name: user.nome, email: user.email });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
