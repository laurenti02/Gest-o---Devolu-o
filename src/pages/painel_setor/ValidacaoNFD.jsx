import SetorPanelBase from "./SetorPanelBase";

export default function ValidacaoNFD() {
  return (
    <SetorPanelBase
      setor="Validação NFD"
      titulo="Validação NFD"
      subtitulo="Confira a NF de devolução enviada pelo solicitante antes de retornar ao ADM"
      icone="NF"
      camposConclusao={[
        {
          id: "notaConfere",
          label: "A NF confere com a devolução?",
          tipo: "select",
          opcoes: ["Sim", "Não"],
          obrigatorio: true,
        },
        {
          id: "cnpjConfere",
          label: "CNPJ confere?",
          tipo: "select",
          opcoes: ["Sim", "Não"],
          obrigatorio: true,
        },
        {
          id: "valorConfere",
          label: "Valor total confere com a soma dos itens?",
          tipo: "select",
          opcoes: ["Sim", "Não"],
          obrigatorio: true,
        },
        {
          id: "observacao",
          label: "Observações",
          tipo: "textarea",
          placeholder: "Inconsistências encontradas, se houver",
          obrigatorio: false,
        },
      ]}
    />
  );
}
