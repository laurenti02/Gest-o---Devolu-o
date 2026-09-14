import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { gerarProtocoloRefaturamento, PERFIL_ETAPA } from "@/lib/refaturamento-fluxo";
import { getSessao, PERFIS_ADM } from "@/lib/auth";

// POST: criação pública (sem login), igual ao formulário de devolução
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      solicitante, setorSolicitante, clienteOriginal, cnpjOriginal,
      notaFiscalOriginal, valor, mercadoriaSaiu, novoDestinatario, novoCnpj, motivo,
    } = body;

    const obrigatorios = { solicitante, setorSolicitante, clienteOriginal, cnpjOriginal, notaFiscalOriginal, valor, mercadoriaSaiu, motivo };
    for (const [campo, v] of Object.entries(obrigatorios)) {
      if (v === undefined || v === null || String(v).trim() === "") {
        return NextResponse.json({ erro: `Campo obrigatório não preenchido: ${campo}` }, { status: 400 });
      }
    }
    if (!["sim", "nao"].includes(mercadoriaSaiu)) {
      return NextResponse.json({ erro: "Valor inválido para 'mercadoria já saiu'." }, { status: 400 });
    }
    const valorNumerico = Number(valor);
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      return NextResponse.json({ erro: "Valor da nota inválido." }, { status: 400 });
    }

    const inserted = await db.insert(schema.refaturamentos).values({
      protocolo: "TEMP",
      solicitante: String(solicitante).trim(),
      setorSolicitante: String(setorSolicitante).trim(),
      clienteOriginal: String(clienteOriginal).trim(),
      cnpjOriginal: String(cnpjOriginal).trim(),
      notaFiscalOriginal: String(notaFiscalOriginal).trim(),
      valor: valorNumerico,
      mercadoriaSaiu,
      novoDestinatario: novoDestinatario ? String(novoDestinatario).trim() : null,
      novoCnpj: novoCnpj ? String(novoCnpj).trim() : null,
      motivo: String(motivo).trim(),
      status: "aguardando_aprovacao",
    });

    const id = Number(inserted.lastInsertRowid);
    const protocolo = gerarProtocoloRefaturamento(id);
    await db.update(schema.refaturamentos).set({ protocolo }).where(eq(schema.refaturamentos.id, id));

    await db.insert(schema.refaturamentoHistorico).values({
      refaturamentoId: id,
      usuario: String(solicitante).trim(),
      acao: "Solicitação de refaturamento cadastrada",
      comentario: null,
    });

    return NextResponse.json({ protocolo }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível registrar a solicitação. Tente novamente." }, { status: 500 });
  }
}

// GET: listagem — ADM vê tudo; demais perfis só a fila da própria etapa
export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const isAdmin = PERFIS_ADM.includes(sessao.perfil);
  const minhaEtapa = PERFIL_ETAPA[sessao.perfil];

  if (!isAdmin && !minhaEtapa) {
    return NextResponse.json({ erro: "Perfil sem acesso ao Refaturamento." }, { status: 403 });
  }

  let lista;
  if (isAdmin) {
    lista = await db.select().from(schema.refaturamentos);
  } else {
    lista = await db
      .select()
      .from(schema.refaturamentos)
      .where(eq(schema.refaturamentos.etapaAtual, minhaEtapa));
    lista = lista.filter((r) => r.status === "aprovado");
  }

  return NextResponse.json({ solicitacoes: lista });
}
