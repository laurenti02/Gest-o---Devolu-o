export const PAPEL_LABELS = {
  diretoria: "Diretoria",
  gerente: "Gerente Comercial",
  adm: "Devolução",
};

export function papelLabel(papel) {
  return PAPEL_LABELS[papel] || papel;
}

export function formatBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS = {
  aguardando_diretoria: { label: "Aguardando Diretoria", tone: "warn" },
  aguardando_gerente: { label: "Aguardando Gerência", tone: "warn" },
  aguardando_adm: { label: "Aguardando ADM", tone: "warn" },
  aprovado_interno: { label: "Aprovado — iniciando operação", tone: "ok" },
  aguardando_nfd: { label: "Aguardando envio da NF", tone: "warn" },
  em_operacao: { label: "Em operação", tone: "info" },
  concluido: { label: "Concluído", tone: "ok" },
  reprovado: { label: "Reprovado", tone: "bad" },
};

export function statusTone(status) {
  return STATUS_LABELS[status]?.tone || "info";
}

export function statusLabel(status) {
  return STATUS_LABELS[status]?.label || status;
}
