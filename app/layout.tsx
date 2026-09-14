import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NTK Devoluções | Grupo Nautika",
  description: "Controle de Solicitações de Devolução do Grupo Nautika",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
