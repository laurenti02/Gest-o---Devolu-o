import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { gerarProtocolo } from "@/lib/fluxo";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresa, cnpj, nomeSolicitante, responsavelRegional, nfOrigem, valor, motivo } = body;

    const camposObrigatorios = { empresa, cnpj, nomeSolicitante, responsavelRegional, nfOrigem, valor, motivo };
    for (const [campo, valorCampo] of Object.entries(camposObrigatorios)) {
      if (valorCampo === undefined || valorCampo === null || String(valorCampo).trim() === "") {
        return NextResponse.json(
          { erro: `Campo obrigatório não preenchido: ${campo}` },
          { status: 400 }
        );
      }
    }

    const valorNumerico = Number(valor);
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      return NextResponse.json({ erro: "Valor da nota inválido." }, { status: 400 });
    }

    const inserted = await db
      .insert(schema.solicitacoes)
      .values({
        protocolo: "TEMP",
        empresa: String(empresa).trim(),
        cnpj: String(cnpj).trim(),
        nomeSolicitante: String(nomeSolicitante).trim(),
        responsavelRegional: String(responsavelRegional).trim(),
        nfOrigem: String(nfOrigem).trim(),
        valor: valorNumerico,
        motivo: String(motivo).trim(),
        status: "aguardando_aprovacao",
      });

    const id = Number(inserted.lastInsertRowid);
    const protocolo = gerarProtocolo(id);

    await db.update(schema.solicitacoes)
      .set({ protocolo })
      .where(eq(schema.solicitacoes.id, id));

    await db.insert(schema.historico)
      .values({
        solicitacaoId: id,
        usuario: nomeSolicitante,
        acao: "Solicitação cadastrada",
        comentario: null,
      });

    return NextResponse.json({ protocolo }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { erro: "Não foi possível registrar a solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}
