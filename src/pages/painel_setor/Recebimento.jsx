import SetorPanelBase from "./SetorPanelBase";

export default function Recebimento() {
  return (
    <SetorPanelBase
      setor="Recebimento"
      titulo="Recebimento"
      subtitulo="Confira o material devolvido antes de liberar para o Financeiro"
      icone="RC"
      camposConclusao={[
        {
          id: "materialIntegro",
          label: "Material chegou íntegro?",
          tipo: "select",
          opcoes: ["Sim", "Não", "Parcialmente"],
          obrigatorio: true,
        },
        {
          id: "quantidadeRecebida",
          label: "Quantidade recebida",
          tipo: "number",
          placeholder: "0",
          obrigatorio: true,
        },
        {
          id: "observacao",
          label: "Observações",
          tipo: "textarea",
          placeholder: "Avarias, divergências de quantidade, etc.",
          obrigatorio: false,
        },
      ]}
    />
  );
}
