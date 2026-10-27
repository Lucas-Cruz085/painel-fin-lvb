import { createFileRoute } from "@tanstack/react-router";
import { PrimeiroAcessoScreen } from "@/components/portal/PrimeiroAcessoScreen";

export const Route = createFileRoute("/primeiro-acesso")({
  head: () => ({
    meta: [
      { title: "Primeiro acesso | NORMAQ JCB" },
      { name: "description", content: "Troca de senha obrigatória no primeiro acesso ao Painel Financeiro NORMAQ JCB." },
    ],
  }),
  component: PrimeiroAcessoScreen,
});