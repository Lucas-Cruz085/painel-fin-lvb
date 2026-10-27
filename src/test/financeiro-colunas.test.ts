import { describe, expect, it } from "vitest";
import { FILTRO_COLUNAS_VAZIO, filtrarPorColunas, type Titulo } from "@/lib/financeiro";

function titulo(parcial: Pick<Titulo, "documento" | "status" | "valor"> & Partial<Titulo>): Titulo {
  return {
    parte: "Oficina Alfa",
    projeto: "Operações",
    emissao: "2026-03-15",
    vencimento: "2026-04-20",
    diasAtraso: parcial.status === "atraso" ? 8 : 0,
    ...parcial,
  };
}

const base = [
  titulo({ documento: "FT-010450", status: "atraso", valor: 1500, parte: "Pneus Carajás", projeto: "Oficina" }),
  titulo({ documento: "FT-010457", status: "a_vencer", valor: 82000, parte: "Energia Sol Nascente", projeto: "Operações", emissao: "2026-08-01", vencimento: "2026-11-02" }),
  titulo({ documento: "FT-010464", status: "liquidado", valor: 15000, parte: "Pneus Norte", projeto: "Oficina" }),
];

describe("filtro por coluna", () => {
  it("cruza documento, parte, projeto, datas, valor e status", () => {
    expect(filtrarPorColunas(base, FILTRO_COLUNAS_VAZIO)).toHaveLength(3);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, documento: "10450" }).map((t) => t.documento)).toEqual(["FT-010450"]);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, parte: "pneus" })).toHaveLength(2);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, projeto: "oficina", status: "liquidado" }).map((t) => t.documento)).toEqual(["FT-010464"]);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, emissao: "15/03/2026" })).toHaveLength(2);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, vencimento: "2026-11" }).map((t) => t.documento)).toEqual(["FT-010457"]);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, valor: "1.500" }).map((t) => t.documento)).toEqual(["FT-010450"]);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, valor: "82000" }).map((t) => t.documento)).toEqual(["FT-010457"]);
    expect(filtrarPorColunas(base, { ...FILTRO_COLUNAS_VAZIO, documento: "FT-010450", status: "a_vencer" })).toHaveLength(0);
  });
});