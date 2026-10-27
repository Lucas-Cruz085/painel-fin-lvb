import { describe, expect, it } from "vitest";
import { checklistSenha } from "@/lib/auth/senha-temporaria";
import { linhaDoRecorte, recorteDoGrafico } from "@/lib/financeiro";

describe("fase 1", () => {
  it("resume o recorte ativo e liga o gráfico ao card", () => {
    expect(linhaDoRecorte("pagar", "atraso", { projeto: "Oficina" }, 34)).toBe(
      "Contas a Pagar · em atraso · Oficina · 34 títulos",
    );
    expect(linhaDoRecorte("receber", null, { inicio: "2026-03-01", fim: "2026-03-31" }, 10)).toBe(
      "Contas a Receber · todos os títulos · 01/03/2026 a 31/03/2026 · 10 títulos",
    );
    expect(recorteDoGrafico("a_vencer")).toBe("avencer");
    expect(recorteDoGrafico("vencido")).toBe("atraso");
    expect(recorteDoGrafico("liquidado")).toBe("liquidado");
    expect(recorteDoGrafico("previsto")).toBeNull();
  });

  it("acende a checagem conforme a senha atende", () => {
    const vazia = checklistSenha("");
    expect(vazia.every((item) => !item.ok)).toBe(true);
    const pronta = checklistSenha("Abcdefghij1!");
    expect(pronta.every((item) => item.ok)).toBe(true);
    const sequencia = checklistSenha("Abcdefgh123!");
    expect(sequencia.find((item) => item.id === "sequencia")?.ok).toBe(false);
    expect(checklistSenha("Abcdefghij1 ").find((item) => item.id === "especial")?.ok).toBe(false);
  });
});