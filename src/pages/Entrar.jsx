import { useNavigate } from "react-router-dom";
import { useAuth, USUARIOS_DEMO } from "../lib/auth";

const DESTINO_POR_PERFIL = {
  adm: "/painel-adm",
  diretoria: "/aprovacoes",
  gerente: "/aprovacoes",
  setor: "/painel-setor",
};

export default function Entrar() {
  const { entrar } = useAuth();
  const navigate = useNavigate();

  function selecionar(email) {
    entrar(email);
    const u = USUARIOS_DEMO.find((x) => x.email === email);
    navigate(DESTINO_POR_PERFIL[u.perfil]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel px-6 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ntk font-display text-sm font-bold text-ink">
            NTK
          </div>
          <p className="font-display text-lg font-semibold text-white">
            Acesso interno
          </p>
        </div>

        <div className="rounded-sm border border-white/10 bg-white/[0.03] px-5 py-4 text-xs text-sand/70">
          Ambiente de demonstração: em produção, este passo é substituído
          pelo login corporativo Microsoft 365 (MSAL), sem seleção manual de
          identidade.
        </div>

        <div className="mt-5 space-y-2">
          {USUARIOS_DEMO.map((u) => (
            <button
              key={u.email}
              onClick={() => selecionar(u.email)}
              className="block w-full rounded-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-sand hover:border-ntk hover:bg-white/[0.08]"
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
