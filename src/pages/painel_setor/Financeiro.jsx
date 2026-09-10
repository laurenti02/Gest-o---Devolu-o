import SetorPanelBase from "./SetorPanelBase";

export default function Financeiro() {
  return (
    <SetorPanelBase
      setor="Financeiro"
      titulo="Financeiro"
      subtitulo="Conclua a devolução e registre a baixa — última etapa do processo"
      icone="FN"
      camposConclusao={[
        {
          id: "formaDevolucao",
          label: "Forma de devolução",
          tipo: "select",
          opcoes: ["Crédito em conta", "Nota de crédito", "Estorno"],
          obrigatorio: true,
        },
        {
          id: "valorCredito",
          label: "Valor do crédito (R$)",
          tipo: "number",
          placeholder: "0,00",
          obrigatorio: true,
        },
        {
          id: "observacao",
          label: "Observações",
          tipo: "textarea",
          placeholder: "Detalhes da baixa financeira",
          obrigatorio: false,
        },
      ]}
    />
  );
}
