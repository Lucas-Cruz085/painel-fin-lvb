import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Painel } from "@/components/financeiro/Painel";
import { TITULOS } from "@/lib/financeiro/mock-data";

vi.mock("@/lib/auth/session", () => ({
  useAuth: () => ({ primeiroNome: "Lucas" }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  if (!("ResizeObserver" in window)) {
    class Observer {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Observer);
  }
});

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Painel />
    </QueryClientProvider>,
  );
}

function card(trecho: string) {
  const botao = screen.getAllByRole("button").find(
    (item) => item.getAttribute("aria-pressed") !== null && (item.textContent ?? "").includes(trecho),
  );
  if (!botao) throw new Error(`Card não encontrado: ${trecho}`);
  return botao;
}

function tabelaDetalhe() {
  const detalhe = screen.getAllByRole("table").find((tabela) => (tabela.textContent ?? "").includes("Documento"));
  if (!detalhe) throw new Error("Tabela de títulos ausente");
  return detalhe;
}

function corpoDetalhe() {
  const corpo = tabelaDetalhe().querySelector("tbody");
  if (!(corpo instanceof HTMLElement)) throw new Error("Tabela de títulos sem corpo");
  return within(corpo);
}

describe("cards do painel", () => {
  it("abre a lista correspondente ao card e volta ao conjunto completo", async () => {
    montar();
    fireEvent.click(await screen.findByRole("button", { name: "Contas a Pagar" }));
    expect(await screen.findByRole("heading", { name: "CONTAS A PAGAR" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Total a Pagar/ })).toBeInTheDocument();

    const pagar = TITULOS.pagar;
    const contar = (status: "a_vencer" | "atraso" | "liquidado" | "aberto") =>
      pagar.filter((t) => (status === "aberto" ? t.status !== "liquidado" : t.status === status)).length;

    fireEvent.click(card("Total a Pagar"));
    expect(await screen.findByRole("heading", { name: "Títulos em aberto · Total a Pagar" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${contar("aberto")} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().queryByText("Pago")).not.toBeInTheDocument();
    expect(card("Total a Pagar")).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(card("Em Atraso"));
    expect(screen.getByRole("heading", { name: "Títulos em atraso" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${contar("atraso")} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().queryByText("A Vencer")).not.toBeInTheDocument();

    fireEvent.click(card("A Vencer"));
    expect(screen.getByRole("heading", { name: "Títulos a vencer" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${contar("a_vencer")} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().queryByText(/Em Atraso/)).not.toBeInTheDocument();

    fireEvent.click(card("Pago no Período"));
    expect(screen.getByRole("heading", { name: "Títulos pagos · Pago no Período" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${contar("liquidado")} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().getAllByText("Pago").length).toBeGreaterThan(0);

    fireEvent.click(card("Índice de Atraso"));
    expect(screen.getByRole("heading", { name: "Títulos em atraso · Índice de Atraso" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${contar("atraso")} títulos`)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(screen.getByRole("heading", { name: "Títulos detalhados · Contas a Pagar" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${pagar.length} títulos`)).length).toBeGreaterThan(0);

    const alvo = pagar[0];
    if (!alvo) throw new Error("Lista de títulos vazia");
    fireEvent.change(screen.getByLabelText("Filtrar documento"), { target: { value: alvo.documento } });
    expect(screen.getAllByText(new RegExp(`(?:^|\\s)${1} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().getByText(alvo.documento)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar colunas" }));
    fireEvent.change(screen.getByLabelText("Filtrar projeto"), { target: { value: "Oficina" } });
    fireEvent.change(screen.getByLabelText("Filtrar status"), { target: { value: "atraso" } });
    const oficinaAtraso = pagar.filter((t) => t.projeto.toLowerCase().includes("oficina") && t.status === "atraso").length;
    expect(screen.getAllByText(new RegExp(`(?:^|\\s)${oficinaAtraso} títulos`)).length).toBeGreaterThan(0);
    expect(corpoDetalhe().queryByText("A Vencer")).not.toBeInTheDocument();
  });
});
