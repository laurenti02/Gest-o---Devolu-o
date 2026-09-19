import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-troque-em-producao-nautika"
);
const COOKIE_NAME = "planner_session"; // nome diferente do "ntk_session" — sessões nunca se misturam

export type PlannerSessionUser = {
  id: number;
  nome: string;
  email: string;
};

export async function criarSessaoPlanner(user: PlannerSessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function encerrarSessaoPlanner() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessaoPlanner(): Promise<PlannerSessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as PlannerSessionUser;
  } catch {
    return null;
  }
}
