import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/portal/LoginScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | NORMAQ JCB" },
      { name: "description", content: "Acesso ao Painel Financeiro NORMAQ JCB." },
    ],
  }),
  component: LoginScreen,
});