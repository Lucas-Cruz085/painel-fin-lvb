import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Painel } from "@/components/financeiro/Painel";

vi.mock("@/lib/auth/session", () => ({
  useAuth: () => ({ primeiroNome: "Lucas" }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 360, height: 200, top: 0, left: 0, bottom: 200, right: 360, x: 0, y: 0, toJSON() { return {}; } });
  class Observer {
    private readonly avisar: ResizeObserverCallback;
    constructor(avisar: ResizeObserverCallback) {
      this.avisar = avisar;
    }
    observe() {
      this.avisar([{ contentRect: { width: 360, height: 200 } } as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", Observer);
});

describe("gráfico de rosca", () => {
  it("escreve a porcentagem dentro das fatias", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Painel />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Distribuição por status" })).toBeInTheDocument();
    await waitFor(() => {
      const textos = [...document.querySelectorAll("svg text")].map((no) => no.textContent ?? "");
    const percentuais = textos.filter((texto) => /\d,\d%$/.test(texto));
    expect(percentuais.length).toBeGreaterThan(0);
    expect(percentuais.every((texto) => texto.endsWith("%"))).toBe(true);
    });
  });
});