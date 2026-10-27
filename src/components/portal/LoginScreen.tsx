import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/session";
import { solicitarResetSenha } from "@/lib/auth/avisos";
import { PORTAL } from "@/lib/portal";
import { AcessoLayout } from "@/components/portal/AcessoLayout";
import { AuthField, RodapeCard } from "@/components/portal/AuthField";
import { NeonFrame } from "@/components/portal/NeonFrame";

export function LoginScreen() {
  const { ready, session, mustChange, entrar } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedindo, setPedindo] = useState(false);

  useEffect(() => {
    if (!ready || !session) return;
    navigate({ to: mustChange ? "/primeiro-acesso" : "/dashboard", replace: true });
  }, [ready, session, mustChange, navigate]);

  if (!ready || session) {
    return (
      <div className="grid min-h-screen place-items-center bg-[oklch(0.12_0.02_262)] text-sm text-auth-muted">
        Carregando…
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAviso("");
    setEnviando(true);
    const mensagem = await entrar(usuario, senha);
    if (mensagem) {
      setErro(mensagem);
      setEnviando(false);
      return;
    }
    setErro("");
  };

  const pedirReset = async () => {
    setErro("");
    setAviso("");
    if (!usuario.trim()) {
      setErro("Informe o usuário para solicitar a troca de senha.");
      return;
    }
    setPedindo(true);
    const resultado = await solicitarResetSenha({ data: { usuario } });
    setPedindo(false);
    if (!resultado.ok) setErro(resultado.mensagem);
    else setAviso(resultado.mensagem);
  };

  return (
    <AcessoLayout>
      <NeonFrame>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand">{PORTAL.nome}</p>
        <h2 className="mt-2 text-2xl font-bold text-auth-foreground">Entrar</h2>
        <p className="mt-1 text-sm text-auth-muted">Use o usuário corporativo e a senha da sua conta.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <AuthField
            id="usuario"
            label="Usuário"
            icon={UserRound}
            type="text"
            value={usuario}
            onChange={setUsuario}
            placeholder="nome.sobrenome"
            autoComplete="username"
          />
          <AuthField
            id="senha"
            label="Senha"
            icon={LockKeyhole}
            type="password"
            value={senha}
            onChange={setSenha}
            autoComplete="current-password"
          />
          {erro && (
            <p role="alert" className="text-sm text-[oklch(0.78_0.14_25)]">
              {erro}
            </p>
          )}
          {aviso && <p className="text-sm text-auth-foreground">{aviso}</p>}
          <button
            type="submit"
            disabled={enviando || pedindo}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Entrar no Painel"}
            {!enviando && <ArrowRight className="h-4 w-4" />}
          </button>
          <button
            type="button"
            disabled={enviando || pedindo}
            onClick={() => void pedirReset()}
            className="text-sm text-auth-muted underline-offset-4 hover:text-brand hover:underline disabled:opacity-60"
          >
            {pedindo ? "Enviando pedido..." : "Esqueci minha senha"}
          </button>
        </form>
        <RodapeCard />
      </NeonFrame>
    </AcessoLayout>
  );
}