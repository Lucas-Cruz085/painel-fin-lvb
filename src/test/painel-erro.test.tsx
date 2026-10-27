import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Painel } from "@/components/financeiro/Painel";

vi.mock("@/lib/auth/session", () => ({
  useAuth: () => ({ primeiroNome: "Lucas" }),
}));

vi.mock("@/lib/financeiro", async () => {
  const atual = await vi.importActual<typeof import("@/lib/financeiro")>("@/lib/financeiro");
  return { ...atual, getPainelFinanceiro: () => Promise.reject(new Error("falha")) };
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("painel sem leitura", () => {
  it("explica a falha e oferece nova tentativa", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Painel />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Não foi possível carregar o painel.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});