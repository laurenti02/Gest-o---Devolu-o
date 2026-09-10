import { useParams, useNavigate, Link } from "react-router-dom";
import db from "../lib/db";
import StatusBadge from "../components/StatusBadge";
import { formatDateTime } from "../lib/format";

export default function StatusPublico() {
  const { protocolo } = useParams();
  const navigate = useNavigate();
  const sol = db.buscarPorProtocolo(protocolo || "");

  if (!sol) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-bad">Protocolo não encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-ntk-dark underline">
          Voltar
        </Link>
      </div>
    );
  }

  const podeAnexarNF = sol.etapaOperacionalAtual === "validacao_nfd" && sol.status === "aguardando_nfd";

  return (
    <div className="min-h-screen bg-sand font-body text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink font-display text-sm font-bold text-ntk">
            NTK
          </div>
          <p className="font-display text-lg font-semibold">Gestão de Devoluções</p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-muted">Protocolo</p>
        <p className="font-display text-3xl font-bold">{sol.protocolo}</p>
        <div className="mt-4 flex justify-center">
          <StatusBadge status={sol.status} />
        </div>
        <p className="mt-6 text-xs text-muted">
          Registrado em {formatDateTime(sol.criadoEm)}
        </p>

        {podeAnexarNF && (
          <button
            onClick={() => navigate(`/ja-solicitei?protocolo=${sol.protocolo}`)}
            className="mt-8 w-full rounded-sm bg-ntk py-3 text-sm font-semibold text-ink hover:bg-ntk-dark hover:text-white"
          >
            Anexar NF de devolução
          </button>
        )}

        <Link
          to="/"
          className="mt-8 block text-sm text-muted underline decoration-dotted underline-offset-2"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
