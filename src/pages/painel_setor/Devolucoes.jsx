import SetorPanelBase from "./SetorPanelBase";

export default function Devolucoes() {
  return (
    <SetorPanelBase
      setor="Devoluções"
      titulo="Devoluções"
      subtitulo="Aprove a solicitação após as aprovações internas, antes de solicitar a NF ao cliente e enviar para Validação NFD"
      icone="DV"
      camposConclusao={[
        {
          id: "conferenciaInicial",
          label: "Conferência inicial concluída?",
          tipo: "select",
          opcoes: ["Sim", "Não"],
          obrigatorio: true,
        },
        {
          id: "observacao",
          label: "Observações",
          tipo: "textarea",
          placeholder: "Detalhes da conferência antes de acionar a Validação NFD",
          obrigatorio: false,
        },
      ]}
    />
  );
}
