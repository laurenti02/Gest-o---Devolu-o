const VARIANTE: Record<string, string> = {
  aguardando_aprovacao: "ntk-pill-warn",
  aprovado: "ntk-pill-ok",
  reprovado: "ntk-pill-bad",
  em_andamento: "ntk-pill-info",
  concluido: "ntk-pill-ok",
  pendente: "ntk-pill-warn",
};

// Etiqueta colorida de status (aprovado = verde, reprovado = vermelho, etc.)
export function StatusPill({ status, rotulo }: { status: string; rotulo?: string }) {
  return <span className={`ntk-pill ${VARIANTE[status] ?? ""}`}>{rotulo ?? status}</span>;
}
