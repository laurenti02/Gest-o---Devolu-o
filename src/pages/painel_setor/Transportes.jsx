import SetorPanelBase from "./SetorPanelBase";

export default function Transportes() {
  return (
    <SetorPanelBase
      setor="Transportes"
      titulo="Transportes"
      subtitulo="Agende a coleta ou entrega do material de devolução"
      icone="TR"
      camposConclusao={[
        {
          id: "tipo",
          label: "Tipo de operação",
          tipo: "select",
          opcoes: ["Coleta", "Entrega"],
          obrigatorio: true,
        },
        {
          id: "dataAgendada",
          label: "Data agendada",
          tipo: "date",
          obrigatorio: true,
        },
        {
          id: "transportadora",
          label: "Transportadora",
          tipo: "text",
          placeholder: "Nome da transportadora",
          obrigatorio: true,
        },
        {
          id: "observacao",
          label: "Observações",
          tipo: "textarea",
          placeholder: "Detalhes do agendamento",
          obrigatorio: false,
        },
      ]}
    />
  );
}
