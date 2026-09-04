import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV_BY_PERFIL = {
  adm: [
    { to: "/aprovacoes", label: "Aprovações" },
    { to: "/relatorio-aprovacoes", label: "Relatório de aprovações" },
    { to: "/painel-adm", label: "Painel ADM" },
    { to: "/anexos", label: "Anexos" },
    { to: "/refaturamento", label: "Refaturamento" },
  ],
  diretoria: [{ to: "/aprovacoes", label: "Aprovações" }],
  gerente: [{ to: "/aprovacoes", label: "Aprovações" }],
  setor: [{ to: "/painel-setor", label: "Painel do setor" }],
};

export default function InternalShell({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const nav = usuario ? NAV_BY_PERFIL[usuario.perfil] || [] : [];

  return (
    <div className="min-h-screen bg-sand font-body text-ink">
      <div className="flex min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel text-sand">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ntk font-display text-sm font-bold text-ink">
              NTK
            </div>
            <div className="font-display text-sm leading-tight">
              Gestão de
              <br />
              Devoluções
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-sm px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-ntk text-ink font-medium"
                      : "text-sand/80 hover:bg-white/5 hover:text-sand"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 px-4 py-4 text-xs text-sand/60">
            <div className="mb-1 font-medium text-sand/90">
              {usuario?.nome}
            </div>
            <div className="truncate">{usuario?.email}</div>
            {usuario?.setor && (
              <div className="mt-1 text-ntk-light">{usuario.setor}</div>
            )}
            <button
              onClick={() => {
                sair();
                navigate("/");
              }}
              className="mt-3 text-sand/70 underline decoration-dotted underline-offset-2 hover:text-sand"
            >
              Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
