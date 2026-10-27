import { describe, expect, it } from "vitest";
import { itensVisiveis, rotaRestrita } from "@/lib/auth/menu";

describe("menu por papel", () => {
  it("esconde Logs e Gestão de quem não é administrador", () => {
    const rotulos = itensVisiveis(false).map((item) => item.label);
    expect(rotulos).toEqual(["Dashboard", "LGPD"]);
    expect(rotaRestrita("/logs")).toBe(true);
    expect(rotaRestrita("/usuarios")).toBe(true);
    expect(rotaRestrita("/dashboard")).toBe(false);
  });

  it("mostra Logs e Gestão para o administrador", () => {
    const rotulos = itensVisiveis(true).map((item) => item.label);
    expect(rotulos).toEqual(["Dashboard", "LGPD", "Logs", "Gestão de usuários"]);
  });
});