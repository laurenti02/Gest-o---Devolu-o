import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "devolucoes.db");
const client = createClient({ url: `file:${dbPath}` });

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
  const initSql = fs.readFileSync(path.join(process.cwd(), "lib", "db", "init.sql"), "utf-8");
  const statements = initSql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt);
  }

  const hash = bcrypt.hashSync(SENHA_PADRAO, 10);

  for (const u of usuarios) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)`,
      args: [u.nome, u.email, hash, u.perfil],
    });
  }

  console.log(`Banco inicializado em ${dbPath}`);
  console.log(`${usuarios.length} usuários criados/verificados.`);
  console.log(`Senha padrão para todos (trocar depois): ${SENHA_PADRAO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
