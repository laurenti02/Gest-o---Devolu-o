import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/fluxo";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const todas = await db.select().from(schema.solicitacoes);
  const aprovacoes = await db.select().from(schema.aprovacoes);

  const colunas = [
    "id",
    "id1_protocolo",
    "nomeCompleto",
    "enderecoEmail",
    "empresa",
    "cnpj",
    "valor",
    "status",
    "statusLabel",
    "msft_data_state",
    "etapaAtual",
    "criadoEm",
    "aprovadores",
  ];

  const linhas = todas.map((s) => {
    const decisoesSolic = aprovacoes.filter((a) => a.solicitacaoId === s.id);
    const aprovadores = decisoesSolic
      .map((d) => `${d.aprovadorNome}:${d.decisao}`)
      .join(" | ");
    return [
      s.id,
      s.protocolo,
      s.nomeSolicitante,
      decisoesSolic[0]?.aprovadorEmail ?? "",
      s.empresa,
      s.cnpj,
      s.valor.toFixed(2),
      s.status,
      STATUS_LABEL[s.status] ?? s.status,
      s.status,
      s.etapaAtual ?? "",
      s.criadoEm,
      aprovadores,
    ];
  });

  const csv = [colunas, ...linhas]
    .map((linha) => linha.map(csvEscape).join(";"))
    .join("\n");

  const bom = "\uFEFF"; // garante acentuação correta ao abrir no Excel
  const dataArquivo = new Date().toISOString().slice(0, 10);

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-devolucoes-${dataArquivo}.csv"`,
    },
  });
}
