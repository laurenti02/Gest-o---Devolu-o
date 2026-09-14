import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessao, PERFIS_APROVACAO } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/fluxo";
import * as XLSX from "xlsx";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao || !PERFIS_APROVACAO.includes(sessao.perfil)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const todas = await db.select().from(schema.solicitacoes);
  const aprovacoes = await db.select().from(schema.aprovacoes);
  const etapas = await db.select().from(schema.etapas);

  const linhasSolicitacoes = todas.map((s) => {
    const decisoesSolic = aprovacoes.filter((a) => a.solicitacaoId === s.id);
    return {
      id: s.id,
      id1_protocolo: s.protocolo,
      nomeCompleto: s.nomeSolicitante,
      enderecoEmail: decisoesSolic[0]?.aprovadorEmail ?? "",
      empresa: s.empresa,
      cnpj: s.cnpj,
      valor: s.valor,
      status: s.status,
      statusLabel: STATUS_LABEL[s.status] ?? s.status,
      msft_data_state: s.status,
      etapaAtual: s.etapaAtual ?? "",
      criadoEm: s.criadoEm,
      aprovadores: decisoesSolic.map((d) => `${d.aprovadorNome}:${d.decisao}`).join(" | "),
    };
  });

  const linhasEtapas = etapas.map((e) => {
    const solicitacao = todas.find((s) => s.id === e.solicitacaoId);
    return {
      protocolo: solicitacao?.protocolo ?? "",
      setor: e.setor,
      status: e.status,
      responsavel: e.responsavel ?? "",
      prazoLimite: e.prazoLimite ?? "",
      concluidoEm: e.concluidoEm ?? "",
      comentario: e.comentario ?? "",
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasSolicitacoes), "Solicitações");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasEtapas), "Etapas por setor");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const dataArquivo = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio-devolucoes-${dataArquivo}.xlsx"`,
    },
  });
}
