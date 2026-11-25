import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

function getDb(): DrizzleDb {
  if (!_db) {
    // Prefere a connection string com pooling (ex.: integração Prisma Postgres
    // na Vercel expõe DATABASE_URL_POOLED) — evita esgotar conexões diretas
    // com muitas funções serverless rodando ao mesmo tempo. Cai para a direta
    // se não houver uma versão com pool configurada.
    const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const client = postgres(url, {
      max: 3,
      prepare: false,
      ssl: local ? false : "require",
      idle_timeout: 20,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Proxy: só abre a conexão de verdade no primeiro uso (evita crash durante
// a etapa de build do Next.js, que apenas importa os módulos sem executá-los).
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
