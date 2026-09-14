import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { criarSessao } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }

  const user = (
    await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, String(email).toLowerCase().trim()))
  )[0];

  if (!user || !user.ativo) {
    return NextResponse.json({ erro: "Usuário não encontrado ou inativo." }, { status: 401 });
  }

  const senhaValida = bcrypt.compareSync(senha, user.senhaHash);
  if (!senhaValida) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  await criarSessao({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil });

  return NextResponse.json({ ok: true, perfil: user.perfil });
}
