import { createContext, useContext, useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Este arquivo SIMULA a identidade autenticada do Microsoft 365 para fins de
// demonstração/desenvolvimento local, já que este ambiente não tem acesso ao
// Azure AD / MSAL do tenant real.
//
// PARA PRODUÇÃO: substitua este contexto por @azure/msal-react (ou
// equivalente), lendo o e-mail autenticado do Microsoft 365 e cruzando com a
// tabela Dataverse "Usuário" para obter o perfil (Administrador, Diretoria,
// Gerente, setor operacional etc.), exatamente como descrito em overview.md
// ("O acesso interno usa exclusivamente a identidade autenticada do
// Microsoft 365, sem senhas armazenadas no navegador ou incluídas no
// código.").
// ---------------------------------------------------------------------------

export const USUARIOS_DEMO = [
  {
    email: "devolucao@gruponautika.com.br",
    nome: "ADM Geral",
    perfil: "adm",
    label: "ADM — devolucao@gruponautika.com.br",
  },
  {
    email: "gabriela@gruponautika.com.br",
    nome: "Gabriela",
    perfil: "diretoria",
    label: "Diretoria — Gabriela",
  },
  {
    email: "tiago@gruponautika.com.br",
    nome: "Tiago",
    perfil: "gerente",
    label: "Gerente Comercial — Tiago",
  },
  {
    email: "leidiane.morais@gruponautika.com.br",
    nome: "Leidiane Morais",
    perfil: "setor",
    setor: "Devoluções",
    label: "Devoluções — Leidiane Morais",
  },
  {
    email: "kaio.morais@gruponautika.com.br",
    nome: "Kaio Morais",
    perfil: "setor",
    setor: "Validação NFD",
    label: "Validação NFD — Kaio Morais",
  },
  {
    email: "matheus.calixto@gruponautika.com.br",
    nome: "Matheus Calixto",
    perfil: "setor",
    setor: "Transportes",
    label: "Transportes — Matheus Calixto",
  },
  {
    email: "larissa.correia@gruponautika.com.br",
    nome: "Larissa Correia",
    perfil: "setor",
    setor: "Recebimento",
    label: "Recebimento — Larissa Correia",
  },
  {
    email: "kaline@gruponautika.com.br",
    nome: "Kaline",
    perfil: "setor",
    setor: "Financeiro",
    label: "Financeiro — Kaline",
  },
];

const AuthContext = createContext(null);
const STORAGE_KEY = "gd_sessao_demo";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [usuario]);

  function entrar(email) {
    const found = USUARIOS_DEMO.find((u) => u.email === email);
    if (found) setUsuario(found);
  }

  function sair() {
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
