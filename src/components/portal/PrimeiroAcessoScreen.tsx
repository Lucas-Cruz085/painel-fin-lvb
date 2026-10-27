import { useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/session";
import { AcessoLayout } from "@/components/portal/AcessoLayout";
import { AuthField, RodapeCard } from "@/components/portal/AuthField";
import { NeonFrame } from "@/components/portal/NeonFrame";
import { ChecklistSenha } from "@/components/portal/ChecklistSenha";

export function PrimeiroAcessoScreen() {
  const { ready, session, mustChange, trocarSenha } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/auth", replace: true });
    else if (!mustChange) navigate({ to: "/dashboard", replace: true });
  }, [ready, session, mustChange, navigate]);

  if (!ready || !session || !mustChange) {
    return (
      <div className="grid min-h-screen place-items-center bg-[oklch(0.12_0.02_262)] text-sm text-auth-muted">
        Carregando…
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    const mensagem = await trocarSenha(senha, confirmacao);
    if (mensagem) {
      setErro(mensagem);
      setEnviando(false);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AcessoLayout>
      <NeonFrame>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand">Primeiro acesso</p>
        <h2 className="mt-2 text-2xl font-bold text-auth-foreground">Defina sua senha</h2>
        <p className="mt-1 text-sm text-auth-muted">
          A senha temporária precisa ser trocada antes de abrir o painel. A nova senha tem no mínimo 12 caracteres, com letras, números, caractere especial e ao menos uma maiúscula, sem números em sequência.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <AuthField id="nova-senha" label="Nova senha" icon={LockKeyhole} type="password" value={senha} onChange={setSenha} autoComplete="new-password" />
          <ChecklistSenha senha={senha} tom="auth" />
          <AuthField
            id="confirma-senha"
            label="Confirmar senha"
            icon={LockKeyhole}
            type="password"
            value={confirmacao}
            onChange={setConfirmacao}
            autoComplete="new-password"
          />
          {erro && (
            <p role="alert" className="text-sm text-[oklch(0.78_0.14_25)]">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {enviando ? "Salvando..." : "Confirmar senha"}
          </button>
        </form>
        <RodapeCard />
      </NeonFrame>
    </AcessoLayout>
  );
}