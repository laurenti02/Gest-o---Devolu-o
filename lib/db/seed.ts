import postgres from "postgres";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("Defina DATABASE_URL (ou POSTGRES_URL) antes de rodar o seed.");
  process.exit(1);
}
const dbUrl: string = url;
const local = /localhost|127\.0\.0\.1/.test(dbUrl);
const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: local ? false : "require" });

const SENHA_PADRAO = "nautika@2026";

type Usuario = { nome: string; email: string; perfil: string };

const usuarios: Usuario[] = [
  { nome: "Administrador Devoluções", email: "devolucao@gruponautika.com.br", perfil: "admin" },
  { nome: "Gabriela", email: "gabriela@gruponautika.com.br", perfil: "diretoria" },
  { nome: "Tiago", email: "tiago@gruponautika.com.br", perfil: "gerente" },
  { nome: "Devolução Fiscal", email: "devolucaofiscal@gruponautika.com.br", perfil: "validacao_nfd" },
  { nome: "Kaio Morais", email: "kaio.morais@gruponautika.com.br", perfil: "validacao_nfd" },
  { nome: "Silvia Baroni", email: "silvia.baroni@omniteca.io", perfil: "validacao_nfd" },
  { nome: "Leidiane Morais", email: "leidiane.morais@gruponautika.com.br", perfil: "admin" },
  { nome: "Victoria Sturaro", email: "victoria.sturaro@gruponautika.com.br", perfil: "admin" },
  { nome: "Matheus Calixto", email: "matheus.calixto@gruponautika.com.br", perfil: "coleta" },
  { nome: "Gabriel Vieira", email: "gabriel.vieira@gruponautika.com.br", perfil: "coleta" },
  { nome: "Joice Sousa", email: "joice.sousa@gruponautika.com.br", perfil: "coleta" },
  { nome: "Larissa Correia", email: "larissa.correia@gruponautika.com.br", perfil: "recebimento" },
  { nome: "Recebimento NTK", email: "recebimento.ntk@gruponautika.com.br", perfil: "recebimento" },
  { nome: "Fiscal", email: "fiscal@gruponautika.com.br", perfil: "entrada_nfd" },
  { nome: "Kaline", email: "kaline@gruponautika.com.br", perfil: "financeiro" },
  { nome: "Financeiro Crédito e Cobrança", email: "financeirocreditoecobranca@gruponautika.com.br", perfil: "financeiro" },
  // Refaturamento: ADM (perfil "admin", já existe acima) aprova; Fiscal reaproveita "entrada_nfd" (já existe);
  // Financeiro reaproveita "financeiro" (já existe); só Logística é conta nova.
  { nome: "Logística", email: "logistica@gruponautika.com.br", perfil: "logistica" },
];

async function main() {
  const initSql = fs.readFileSync(path.join(process.cwd(), "lib", "db", "init-pg.sql"), "utf-8");
  const statements = initSql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }

  const hash = bcrypt.hashSync(SENHA_PADRAO, 10);

  for (const u of usuarios) {
    await sql`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES (${u.nome}, ${u.email}, ${hash}, ${u.perfil})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  console.log(`Banco inicializado em: ${dbUrl.replace(/:[^:@]*@/, ":****@")}`);
  console.log(`${usuarios.length} usuários criados/verificados.`);
  console.log(`Senha padrão para todos (trocar depois): ${SENHA_PADRAO}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
