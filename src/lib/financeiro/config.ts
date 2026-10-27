import type { Modo } from "./types";

/** Todos os textos que dependem do modo ficam aqui. */
export const MODO_CONFIG: Record<
  Modo,
  {
    aba: string;
    titulo: string;
    parte: string;
    liquidado: string;
    totalLabel: string;
    liquidadoLabel: string;
    indiceLabel: string;
    doTotal: string;
    previsto: string;
    ranking: string;
  }
> = {
  receber: {
    aba: "Contas a Receber",
    titulo: "CONTAS A RECEBER",
    parte: "Cliente",
    liquidado: "Recebido",
    totalLabel: "Total a Receber",
    liquidadoLabel: "Recebido no Período",
    indiceLabel: "Índice de Inadimplência",
    doTotal: "do total a receber",
    previsto: "Entrada prevista",
    ranking: "Top 10 por Cliente",
  },
  pagar: {
    aba: "Contas a Pagar",
    titulo: "CONTAS A PAGAR",
    parte: "Fornecedor",
    liquidado: "Pago",
    totalLabel: "Total a Pagar",
    liquidadoLabel: "Pago no Período",
    indiceLabel: "Índice de Atraso",
    doTotal: "do total a pagar",
    previsto: "Saída prevista",
    ranking: "Top 10 por Fornecedor",
  },
};

export const STATUS_NOME = (modo: Modo) => ({
  a_vencer: "A Vencer",
  atraso: "Em Atraso",
  liquidado: MODO_CONFIG[modo].liquidado,
});
