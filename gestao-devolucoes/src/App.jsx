import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import RequireRole from "./components/RequireRole";

import Home from "./pages/Home";
import StatusPublico from "./pages/StatusPublico";
import JaSolicitei from "./pages/JaSolicitei";
import Entrar from "./pages/Entrar";
import Aprovacoes from "./pages/Aprovacoes";
import RelatorioAprovacoes from "./pages/RelatorioAprovacoes";
import PainelADM from "./pages/painel_adm/PainelADM";
import PainelSetor from "./pages/PainelSetor";
import Anexos from "./pages/Anexos";
import Refaturamento from "./pages/Refaturamento";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Público — sem login */}
          <Route path="/" element={<Home />} />
          <Route path="/status/:protocolo" element={<StatusPublico />} />
          <Route path="/ja-solicitei" element={<JaSolicitei />} />

          {/* Acesso interno */}
          <Route path="/entrar" element={<Entrar />} />

          <Route
            path="/aprovacoes"
            element={
              <RequireRole perfis={["diretoria", "gerente", "adm"]}>
                <Aprovacoes />
              </RequireRole>
            }
          />
          <Route
            path="/relatorio-aprovacoes"
            element={
              <RequireRole perfis={["adm"]}>
                <RelatorioAprovacoes />
              </RequireRole>
            }
          />
          <Route
            path="/painel-adm"
            element={
              <RequireRole perfis={["adm"]}>
                <PainelADM />
              </RequireRole>
            }
          />
          <Route
            path="/painel-setor"
            element={
              <RequireRole perfis={["setor"]}>
                <PainelSetor />
              </RequireRole>
            }
          />
          <Route
            path="/anexos"
            element={
              <RequireRole perfis={["adm"]}>
                <Anexos />
              </RequireRole>
            }
          />
          <Route
            path="/refaturamento"
            element={
              <RequireRole perfis={["adm"]}>
                <Refaturamento />
              </RequireRole>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
