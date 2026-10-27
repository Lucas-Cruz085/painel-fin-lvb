import { createFileRoute } from "@tanstack/react-router";
import { LogsPage } from "@/components/portal/LogsPage";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({
    meta: [
      { title: "Logs | NORMAQ JCB" },
      { name: "description", content: "Registros de uso do Painel Financeiro NORMAQ JCB." },
    ],
  }),
  component: LogsPage,
});