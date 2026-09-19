function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOf(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function defaultPlannerData() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    mesReferencia: today.slice(0, 7),
    metasComercial: [
      { id: uid(), label: "Meta de vendas (R$)", meta: 50000, auto: "vendasRealizadas" },
      { id: uid(), label: "Novos clientes", meta: 5, auto: "novosClientes" },
      { id: uid(), label: "Reuniões comerciais", meta: 20, auto: null, realizado: 0 },
      { id: uid(), label: "Propostas enviadas", meta: 10, auto: "propostasEnviadas" },
    ],
    metasAdmin: [
      { id: uid(), label: "Tarefas concluídas", meta: 30, auto: "tarefasConcluidas" },
    ],
    agenda: {},
    semana: {
      inicio: mondayOf(today),
      grid: {},
      prioridades: [{ id: uid(), texto: "", responsavel: "", prazo: "", status: "Não iniciado" }],
    },
    funil: [
      {
        id: uid(),
        cliente: "Empresa Exemplo Ltda",
        contato: "Fulano da Silva",
        info: "(11) 90000-0000",
        origem: "Indicação",
        vendedor: "Você",
        status: "Em andamento",
        valor: 5000,
        data: addDays(today, 15),
        pedido: null,
        obs: "Aguardando retorno da proposta",
      },
    ],
    clientes: [
      {
        id: uid(),
        cliente: "Empresa Exemplo Ltda",
        contato: "Fulano da Silva",
        info: "contato@exemplo.com",
        ultimaCompra: addDays(today, -30),
        proximoContato: addDays(today, 7),
        status: "Ativo",
        obs: "Prefere contato por e-mail",
      },
    ],
    tarefas: [
      {
        id: uid(),
        tarefa: "Emitir nota fiscal do pedido 1234",
        responsavel: "Você",
        prioridade: "Alta",
        prazo: addDays(today, 2),
        status: "Pendente",
        obs: "",
      },
    ],
  };
}
