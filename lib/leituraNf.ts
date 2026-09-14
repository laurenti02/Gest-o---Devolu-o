import { XMLParser } from "fast-xml-parser";

export type ItemNf = {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

export type ResultadoLeitura = {
  numeroNota: string | null;
  cliente: string | null;
  cnpj: string | null;
  valorTotal: number | null;
  itens: ItemNf[];
  inconsistencias: string[];
  status: "conferido" | "inconsistente" | "processando";
};

function arr<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

export function lerXmlNfe(xmlContent: string): ResultadoLeitura {
  const parser = new XMLParser({ ignoreAttributes: false });
  const inconsistencias: string[] = [];
  try {
    const json = parser.parse(xmlContent);
    const infNFe = json?.nfeProc?.NFe?.infNFe ?? json?.NFe?.infNFe;
    if (!infNFe) {
      return {
        numeroNota: null,
        cliente: null,
        cnpj: null,
        valorTotal: null,
        itens: [],
        inconsistencias: ["XML não reconhecido como NF-e padrão. Necessária conferência manual."],
        status: "inconsistente",
      };
    }

    const numeroNota = infNFe.ide?.nNF ? String(infNFe.ide.nNF) : null;
    const cliente = infNFe.dest?.xNome ?? null;
    const cnpj = infNFe.dest?.CNPJ ? String(infNFe.dest.CNPJ) : infNFe.dest?.CPF ? String(infNFe.dest.CPF) : null;
    const valorTotal = infNFe.total?.ICMSTot?.vNF ? Number(infNFe.total.ICMSTot.vNF) : null;

    const dets = arr(infNFe.det);
    const itens: ItemNf[] = dets.map((d: any) => ({
      codigo: d.prod?.cProd ?? "",
      descricao: d.prod?.xProd ?? "",
      quantidade: Number(d.prod?.qCom ?? 0),
      valorUnitario: Number(d.prod?.vUnCom ?? 0),
      valorTotal: Number(d.prod?.vProd ?? 0),
    }));

    const somaItens = itens.reduce((acc, it) => acc + it.valorTotal, 0);
    if (valorTotal !== null && Math.abs(somaItens - valorTotal) > 0.05) {
      inconsistencias.push(
        `Soma dos itens (R$ ${somaItens.toFixed(2)}) diverge do valor total da nota (R$ ${valorTotal.toFixed(2)}).`
      );
    }
    if (!numeroNota) inconsistencias.push("Número da nota não identificado.");
    if (!cnpj) inconsistencias.push("CNPJ do destinatário não identificado.");

    return {
      numeroNota,
      cliente,
      cnpj,
      valorTotal,
      itens,
      inconsistencias,
      status: inconsistencias.length > 0 ? "inconsistente" : "conferido",
    };
  } catch {
    return {
      numeroNota: null,
      cliente: null,
      cnpj: null,
      valorTotal: null,
      itens: [],
      inconsistencias: ["Falha ao interpretar o XML enviado. Necessária conferência manual."],
      status: "inconsistente",
    };
  }
}

// Extração básica a partir de texto de PDF (heurística por regex) — quando não for XML
export function lerTextoPdf(texto: string): ResultadoLeitura {
  const inconsistencias: string[] = [];

  const numeroMatch = texto.match(/N[ºFo°]{1,3}\s*(?:da\s*)?(?:NF|Nota)?[\s:.-]*([\d]{4,10})/i);
  const cnpjMatch = texto.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
  const valorMatch = texto.match(/(?:Valor\s*Total|Total\s*da\s*NF|VALOR TOTAL)[^\d]{0,15}([\d.,]+)/i);

  const numeroNota = numeroMatch ? numeroMatch[1] : null;
  const cnpj = cnpjMatch ? cnpjMatch[1] : null;
  const valorTotal = valorMatch ? Number(valorMatch[1].replace(/\./g, "").replace(",", ".")) : null;

  if (!numeroNota) inconsistencias.push("Não foi possível identificar o número da nota automaticamente.");
  if (!cnpj) inconsistencias.push("Não foi possível identificar o CNPJ automaticamente.");
  if (!valorTotal) inconsistencias.push("Não foi possível identificar o valor total automaticamente.");
  inconsistencias.push("Leitura via PDF é heurística — confirme os dados manualmente antes de aprovar.");

  return {
    numeroNota,
    cliente: null,
    cnpj,
    valorTotal,
    itens: [],
    inconsistencias,
    status: "inconsistente",
  };
}

export function resultadoManual(): ResultadoLeitura {
  return {
    numeroNota: null,
    cliente: null,
    cnpj: null,
    valorTotal: null,
    itens: [],
    inconsistencias: ["Arquivo de imagem — leitura automática não disponível. Necessária conferência manual pelo Fiscal."],
    status: "processando",
  };
}
