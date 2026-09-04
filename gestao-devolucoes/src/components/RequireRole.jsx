import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import InternalShell from "./InternalShell";

// Verifica a identidade e o perfil ativo antes de montar a página, como
// descrito em overview.md: "Rotas protegidas são verificadas antes da
// montagem das páginas para impedir consultas ou gravações no Dataverse por
// perfis não autorizados."
export default function RequireRole({ perfis, children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/entrar" replace />;
  }

  if (!perfis.includes(usuario.perfil)) {
    return (
      <InternalShell>
        <div className="p-8">
          <div className="rounded-sm border border-bad/30 bg-badbg px-5 py-4 text-bad">
            Seu perfil ({usuario.perfil}) não tem acesso a esta página.
          </div>
        </div>
      </InternalShell>
    );
  }

  return children;
}
