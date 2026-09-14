// Definição central do fluxo por setor, SLAs e helpers de protocolo/prazo

export const ETAPAS_FLUXO = [
  { setor: "validacao_nfd", ordem: 1, label: "Validação NFD", prazoHorasUteis: 8 },
  { setor: "retorno_adm", ordem: 2, label: "Retorno ADM", prazoHorasUteis: 4 },
  { setor: "transportes", ordem: 3, label: "Transportes (Coleta/Entrega)", prazoHorasUteis: 24 },
  { setor: "recebimento", ordem: 4, label: "Recebimento", prazoHorasUteis: 24 },
  { setor: "financeiro", ordem: 5, label: "Financeiro", prazoHorasUteis: 24 },
] as const;

export const SETOR_LABEL: Record<string, string> = {
  validacao_nfd: "Validação NFD",
  retorno_adm: "Retorno ADM",
  transportes: "Transportes",
  recebimento: "Recebimento",
  financeiro: "Financeiro",
  entrada_nfd: "Entrada da NFD",
  admin: "Administrador",
  diretoria: "Diretoria",
  gerente: "Gerente",
  coleta: "Coleta",
};

export const STATUS_LABEL: Record<string, string> = {
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export function gerarProtocolo(id: number): string {
  const ano = new Date().getFullYear();
  return `DEV-${ano}-${String(id).padStart(6, "0")}`;
}

// Soma horas úteis (seg-sex, 08h-18h) a partir de agora, retorna ISO string do prazo limite
export function calcularPrazoLimite(horasUteis: number, referencia = new Date()): string {
  let restante = horasUteis;
  const data = new Date(referencia);

  // normaliza para dentro do expediente
  const normalizar = (d: Date) => {
    const dia = d.getDay();
    if (dia === 0) { d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); }
    if (dia === 6) { d.setDate(d.getDate() + 2); d.setHours(8, 0, 0, 0); }
    if (d.getHours() < 8) d.setHours(8, 0, 0, 0);
    if (d.getHours() >= 18) { d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); }
  };
  normalizar(data);

  while (restante > 0) {
    const fimDoDia = new Date(data);
    fimDoDia.setHours(18, 0, 0, 0);
    const horasDisponiveisHoje = (fimDoDia.getTime() - data.getTime()) / 3600000;

    if (restante <= horasDisponiveisHoje) {
      data.setTime(data.getTime() + restante * 3600000);
      restante = 0;
    } else {
      restante -= horasDisponiveisHoje;
      data.setDate(data.getDate() + 1);
      data.setHours(8, 0, 0, 0);
      normalizar(data);
    }
  }
  return data.toISOString();
}

export function estaAtrasado(prazoLimite: string | null, status: string): boolean {
  if (!prazoLimite || status === "concluido") return false;
  return new Date(prazoLimite).getTime() < Date.now();
}
