import { createFileRoute } from "@tanstack/react-router";
import { LgpdPage } from "@/components/portal/LgpdPage";

export const Route = createFileRoute("/_app/lgpd")({
  head: () => ({
    meta: [
      { title: "LGPD | NORMAQ JCB" },
      { name: "description", content: "Rascunho do aviso de proteção de dados do Painel Financeiro NORMAQ JCB." },
    ],
  }),
  component: LgpdPage,
});