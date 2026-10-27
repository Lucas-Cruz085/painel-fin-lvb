import { createFileRoute } from "@tanstack/react-router";
import { GestaoUsuarios } from "@/components/portal/GestaoUsuarios";

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão de usuários | NORMAQ JCB" },
      { name: "description", content: "Inclusão de usuários do Painel Financeiro NORMAQ JCB." },
    ],
  }),
  component: GestaoUsuarios,
});