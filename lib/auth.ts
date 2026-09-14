import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-troque-em-producao-nautika"
);
const COOKIE_NAME = "ntk_session";

export type SessionUser = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
};

export async function criarSessao(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessao(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export { PERFIS_ADM, PERFIS_APROVACAO, PERFIS_SETOR } from "./perfis";
