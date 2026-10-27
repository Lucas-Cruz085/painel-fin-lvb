import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LgpdPage } from "@/components/portal/LgpdPage";
import { LogsPage } from "@/components/portal/LogsPage";
import { emailTecnico, mensagemLogin } from "@/lib/auth/email";
import { textoDoAviso } from "@/lib/auth/aviso-texto";
import { mensagemSenhaInvalida, senhaAtendePolitica, senhaTemporaria, temNumerosEmSequencia } from "@/lib/auth/senha-temporaria";
import { perfilDe } from "@/lib/auth/perfil";
import { contarFiltros, filtrarLogs, type RegistroLog } from "@/lib/logs";

describe("acesso", () => {
  it("monta o e-mail técnico da NORMAQ", () => {
    expect(emailTecnico("  Lucas.Cruz ")).toBe("lucas.cruz@normaq.local");
    expect(emailTecnico("Lucas.Cruz@empresa.com")).toBe("lucas.cruz@normaq.local");
    expect(emailTecnico("lucas cruz!")).toBe("lucascruz@normaq.local");
  });

  it("traduz as falhas de login", () => {
    expect(mensagemLogin("Invalid login credentials", "invalid_credentials")).toBe("Usuário ou senha inválidos.");
    expect(mensagemLogin("Email not confirmed", "email_not_confirmed")).toBe(
      "Usuário ainda não confirmado. Contate o administrador.",
    );
    expect(mensagemLogin("network down")).toBe("Não foi possível entrar. Tente novamente.");
  });

  it("separa administrador, usuário e troca obrigatória de senha", () => {
    expect(
      perfilDe({
        email: "ana.souza@normaq.local",
        app_metadata: { role: "admin", must_change_password: true },
      }).papel,
    ).toBe("Administrador");
    const comum = perfilDe({ email: "ana.souza@normaq.local", user_metadata: { nome: "Ana Souza" } });
    expect(comum.papel).toBe("Usuário");
    expect(comum.primeiroNome).toBe("Ana");
    expect(comum.mustChange).toBe(false);
    expect(
      perfilDe({
        email: "ana.souza@normaq.local",
        app_metadata: { role: "admin", must_change_password: true },
      }).mustChange,
    ).toBe(true);
  });
});

describe("logs", () => {
  const base: RegistroLog[] = [
    { em: "2026-10-01T10:00:00", usuario: "Ana", acao: "login", detalhe: "entrada" },
    { em: "2026-10-02T10:00:00", usuario: "Bruno", acao: "consulta", detalhe: "títulos" },
  ];

  it("filtra e conta sem depender da faixa aberta", () => {
    expect(contarFiltros({ usuario: "Ana" })).toBe(1);
    expect(filtrarLogs(base, { usuario: "bru" }).map((item) => item.usuario)).toEqual(["Bruno"]);
    expect(filtrarLogs(base, {})).toHaveLength(2);
  });
});

describe("LGPD", () => {
  it("mostra o rascunho do portal financeiro", () => {
    render(<LgpdPage />);
    expect(screen.getByRole("heading", { name: "Proteção de dados pessoais" })).toBeInTheDocument();
    expect(screen.getAllByText("Rascunho").length).toBeGreaterThan(1);
    expect(screen.getByText(/números do dashboard são fictícios/i)).toBeInTheDocument();
    expect(screen.getByText(/mínimo 12 caracteres, com letras, números, caractere especial/i)).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/combustível|abastecimento|rateio/);
  });
});

describe("tela de logs", () => {
  it("esconde os campos ao encolher e mantém o filtro ativo", () => {
    render(<LogsPage />);
    expect(screen.queryByLabelText("Usuário")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expandir" }));
    fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Encolher" }));
    expect(screen.queryByLabelText("Usuário")).not.toBeInTheDocument();
    expect(screen.getByText("1 filtro")).toBeInTheDocument();
    expect(screen.getByText("Nenhum registro com esses filtros.")).toBeInTheDocument();
  });
});

describe("aviso de senha", () => {
  it("descreve o pedido para os administradores", () => {
    expect(textoDoAviso("Bruna Silva")).toBe("Bruna Silva solicitou a troca de senha.");
    expect(textoDoAviso("  ")).toBe("Um usuário solicitou a troca de senha.");
  });
});

describe("senha temporária", () => {
  it("cumpre a política de senha nova e não repete números em sequência", () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const senha = senhaTemporaria();
      expect(senhaAtendePolitica(senha)).toBe(true);
      expect(temNumerosEmSequencia(senha)).toBe(false);
      expect(senha).toMatch(/[A-Z]/);
      expect(senha).toMatch(/[a-z]/);
      expect(senha).toMatch(/[0-9]/);
      expect(senha).toMatch(/[!@#$%&*?]/);
      vistas.add(senha);
    }
    expect(vistas.size).toBe(30);
    expect(mensagemSenhaInvalida("Abcdefghij1!")).toBeNull();
    expect(mensagemSenhaInvalida("curta1!A")).toMatch(/12/);
    expect(mensagemSenhaInvalida("abcdefghij1!")).toMatch(/maiúscula/);
    expect(mensagemSenhaInvalida("Abcdefgh123!")).toMatch(/sequência/);
    expect(mensagemSenhaInvalida("Abcdef9876!x")).toMatch(/sequência/);
    expect(mensagemSenhaInvalida("Abcdefgh12!X")).toBeNull();
    expect(mensagemSenhaInvalida("Abcdefg210!x")).toMatch(/sequência/);
    expect(mensagemSenhaInvalida("SomenteLetras1")).toMatch(/especiais/);
  });
});
