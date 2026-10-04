import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

function getDb(): DrizzleDb {
  if (!_db) {
    // Se TURSO_DATABASE_URL estiver configurada (produção na Vercel), usa o banco
    // remoto Turso. Caso contrário, cai para um arquivo SQLite local (dev/local).
    const turso = process.env.TURSO_DATABASE_URL;
    const client = turso
      ? createClient({ url: turso, authToken: process.env.TURSO_AUTH_TOKEN })
      : (() => {
          const dataDir = path.join(process.cwd(), "data");
          if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
          return createClient({ url: `file:${path.join(dataDir, "devolucoes.db")}` });
        })();
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
