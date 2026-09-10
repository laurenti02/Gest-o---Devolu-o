import { useAuth } from "../../lib/auth";
import InternalShell from "../../components/InternalShell";
import Devolucoes from "./Devolucoes";
import ValidacaoNFD from "./ValidacaoNFD";
import Transportes from "./Transportes";
import Recebimento from "./Recebimento";
import Financeiro from "./Financeiro";

const PAINEIS_POR_SETOR = {
  Devoluções: Devolucoes,
  "Validação NFD": ValidacaoNFD,
  Transportes: Transportes,
  Recebimento: Recebimento,
  Financeiro: Financeiro,
};

// Mostra o painel dedicado do setor do usuário logado. Cada setor tem sua
// própria tela e formulário (ver SetorPanelBase.jsx e os arquivos
// ValidacaoNFD.jsx, Transportes.jsx, Recebimento.jsx, Financeiro.jsx).
export default function PainelSetor() {
  const { usuario } = useAuth();
  const Painel = PAINEIS_POR_SETOR[usuario.setor];

  if (!Painel) {
    return (
      <InternalShell>
        <div className="mx-auto max-w-md px-8 py-16 text-center">
          <p className="rounded-sm border border-line bg-white px-5 py-6 text-sm text-muted">
            Não há um painel configurado para o setor "{usuario.setor}" ainda.
          </p>
        </div>
      </InternalShell>
    );
  }

  return <Painel />;
}
