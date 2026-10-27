import { createFileRoute } from "@tanstack/react-router";
import { Painel } from "@/components/financeiro/Painel";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | NORMAQ JCB" },
      { name: "description", content: "Indicadores, gráficos e títulos de contas a pagar e a receber da NORMAQ JCB." },
      { property: "og:title", content: "Dashboard | NORMAQ JCB" },
      { property: "og:description", content: "Indicadores, gráficos e títulos de contas a pagar e a receber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});