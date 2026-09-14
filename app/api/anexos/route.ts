import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { lerXmlNfe, lerTextoPdf, resultadoManual } from "@/lib/leituraNf";
import fs from "fs";
import path from "path";
import { calcularPrazoLimite } from "@/lib/fluxo";

const TAMANHO_MAX_MB = 15;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const protocolo = String(form.get("protocolo") || "").toUpperCase().trim();
    const arquivo = form.get("arquivo") as File | null;

    if (!protocolo || !arquivo) {
      return NextResponse.json({ erro: "Protocolo e arquivo são obrigatórios." }, { status: 400 });
    }

    const solicitacao = (
      await db
        .select()
        .from(schema.solicitacoes)
        .where(eq(schema.solicitacoes.protocolo, protocolo))
    )[0];

    if (!solicitacao) {
      return NextResponse.json({ erro: "Protocolo não encontrado." }, { status: 404 });
    }
    if (solicitacao.status === "aguardando_aprovacao" || solicitacao.status === "reprovado") {
      return NextResponse.json(
        { erro: "O anexo só pode ser enviado após a aprovação da solicitação." },
        { status: 403 }
      );
    }

    const anexoExistente = (
      await db
        .select()
        .from(schema.anexosNf)
        .where(eq(schema.anexosNf.solicitacaoId, solicitacao.id))
    )[0];
    if (anexoExistente) {
      return NextResponse.json({ erro: "A NF de devolução já foi anexada para este protocolo." }, { status: 409 });
    }

    const tamanhoMb = arquivo.size / (1024 * 1024);
    if (tamanhoMb > TAMANHO_MAX_MB) {
      return NextResponse.json({ erro: `Arquivo excede o tamanho máximo de ${TAMANHO_MAX_MB}MB.` }, { status: 400 });
    }

    const extensao = (arquivo.name.split(".").pop() || "").toLowerCase();
    const formatosValidos: Record<string, "pdf" | "xml" | "imagem"> = {
      pdf: "pdf",
      xml: "xml",
      png: "imagem",
      jpg: "imagem",
      jpeg: "imagem",
    };
    const formato = formatosValidos[extensao];
    if (!formato) {
      return NextResponse.json({ erro: "Formato inválido. Envie PDF, XML ou imagem (PNG/JPG)." }, { status: 400 });
    }

    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const nomeArquivo = `${protocolo}-${Date.now()}.${extensao}`;
    const destino = path.join(process.cwd(), "public", "uploads", nomeArquivo);
    fs.writeFileSync(destino, bytes);

    let leitura;
    if (formato === "xml") {
      leitura = lerXmlNfe(bytes.toString("utf-8"));
    } else if (formato === "pdf") {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: bytes });
        const parsed = await parser.getText();
        await parser.destroy();
        leitura = lerTextoPdf(parsed.text);
      } catch {
        leitura = resultadoManual();
      }
    } else {
      leitura = resultadoManual();
    }

    // valida contra o CNPJ e valor informados no cadastro, quando lidos
    const inconsistencias = [...leitura.inconsistencias];
    if (leitura.cnpj && leitura.cnpj.replace(/\D/g, "") !== solicitacao.cnpj.replace(/\D/g, "")) {
      inconsistencias.push("CNPJ da NF de devolução diverge do CNPJ informado na solicitação.");
    }

    await db.insert(schema.anexosNf)
      .values({
        solicitacaoId: solicitacao.id,
        arquivoNome: arquivo.name,
        arquivoPath: `/uploads/${nomeArquivo}`,
        formato,
        numeroNota: leitura.numeroNota,
        clienteLido: leitura.cliente,
        cnpjLido: leitura.cnpj,
        valorTotalLido: leitura.valorTotal,
        itensJson: JSON.stringify(leitura.itens),
        inconsistencias: JSON.stringify(inconsistencias),
        status: inconsistencias.length > 0 ? "inconsistente" : "conferido",
      });

    // libera etapa de Validação NFD
    const prazoLimite = calcularPrazoLimite(8);
    await db.insert(schema.etapas)
      .values({
        solicitacaoId: solicitacao.id,
        setor: "validacao_nfd",
        ordem: 1,
        status: "pendente",
        prazoHorasUteis: 8,
        prazoLimite,
      });

    await db.update(schema.solicitacoes)
      .set({ status: "em_andamento", etapaAtual: "validacao_nfd", atualizadoEm: new Date().toISOString() })
      .where(eq(schema.solicitacoes.id, solicitacao.id));

    await db.insert(schema.historico)
      .values({
        solicitacaoId: solicitacao.id,
        usuario: "Solicitante",
        acao: "NF de devolução anexada",
        comentario: inconsistencias.length > 0 ? `Inconsistências: ${inconsistencias.join(" | ")}` : null,
      });

    return NextResponse.json({ ok: true, status: inconsistencias.length > 0 ? "inconsistente" : "conferido" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Falha ao processar o anexo." }, { status: 500 });
  }
}
