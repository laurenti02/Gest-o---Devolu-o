// Definição central do fluxo de Refaturamento.
// Reaproveita perfis que já existem no app de Devolução sempre que faz sentido
// (mesmo time cuidando da mesma função nos dois fluxos):
//   - ADM (perfil "admin") aprova, igual na Devolução
//   - Fiscal reaproveita o perfil "entrada_nfd" (fiscal@, kaio.morais@, silvia.baroni@)
//   - Financeiro reaproveita o perfil "financeiro" (kaline@, financeirocreditoecobranca@)
//   - Logística é o único perfil novo ("logistica")

export const ETAPA_PERFIL: Record<string, string> = {
  logistica: "logistica",
  fiscal: "entrada_nfd",
  financeiro: "financeiro",
};

export const PERFIL_ETAPA: Record<string, string> = {
  logistica: "logistica",
  entrada_nfd: "fiscal",
  financeiro: "financeiro",
};

export const ETAPA_LABEL: Record<string, string> = {
  logistica: "Logística",
  fiscal: "Fiscal",
  financeiro: "Financeiro",
  concluido: "Concluído",
};

export const STATUS_LABEL: Record<string, string> = {
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export function gerarProtocoloRefaturamento(id: number): string {
  const ano = new Date().getFullYear();
  return `REF-${ano}-${String(id).padStart(6, "0")}`;
}

// Perfis que enxergam o link/painel de Refaturamento na navegação interna
export const PERFIS_REFATURAMENTO = ["admin", "logistica", "entrada_nfd", "financeiro"];
