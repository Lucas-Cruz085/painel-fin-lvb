import { describe, expect, it } from "vitest";
import { montarPainel, rotuloRecorte, titulosDoRecorte, type Titulo } from "@/lib/financeiro";

function titulo(status: Titulo["status"], valor: number): Titulo {
  return {
    parte: "Oficina",
    projeto: "Obra",
    documento: `${status}-${valor}`,
    emissao: "2026-01-01",
    vencimento: "2026-03-01",
    valor,
    status,
    diasAtraso: status === "atraso" ? 12 : 0,
  };
}

const base = [titulo("a_vencer", 100), titulo("atraso", 40), titulo("liquidado", 60)];

describe("recorte dos cards", () => {
  it("separa em aberto, atraso, a vencer, liquidados e o índice", () => {
    const painel = montarPainel("pagar", base, [], {});
    const soma = (id: "total" | "liquidado" | "atraso" | "avencer" | "indice") =>
      titulosDoRecorte(painel.detalhado, id).reduce((s, t) => s + t.valor, 0);
    const kpi = (id: string) => painel.kpis.find((k) => k.id === id)?.valor;

    expect(titulosDoRecorte(painel.detalhado, "total").map((t) => t.status).sort()).toEqual(["a_vencer", "atraso"]);
    expect(soma("total")).toBe(kpi("total"));
    expect(soma("atraso")).toBe(kpi("atraso"));
    expect(soma("avencer")).toBe(kpi("avencer"));
    expect(soma("liquidado")).toBe(kpi("liquidado"));
    expect(titulosDoRecorte(painel.detalhado, "indice").every((t) => t.status === "atraso")).toBe(true);
    expect(rotuloRecorte("pagar", "total")).toBe("Títulos em aberto · Total a Pagar");
    expect(rotuloRecorte("receber", "liquidado")).toBe("Títulos recebidos · Recebido no Período");
    expect(rotuloRecorte("pagar", "indice")).toBe("Títulos em atraso · Índice de Atraso");
  });
});