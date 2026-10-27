import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { emailTecnico, mensagemLogin } from "@/lib/auth/email";
import { mensagemSenhaInvalida } from "@/lib/auth/senha-temporaria";
import { perfilDe, type PerfilAuth } from "@/lib/auth/perfil";
import { concluirPrimeiroAcesso } from "@/lib/auth/server";
import { obterCliente } from "@/lib/auth/supabase";

type AuthValue = PerfilAuth & {
  ready: boolean;
  admin: boolean;
  session: Session | null;
  entrar: (usuario: string, senha: string) => Promise<string | null>;
  sair: () => Promise<void>;
  trocarSenha: (senha: string, confirmacao: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function confirmarAdmin(supabase: SupabaseClient, session: Session) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: session.user.id,
    _role: "admin",
  });
  if (!error) return data === true;
  return perfilDe(session.user).papel === "Administrador";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    let cancelar = () => {};

    const aplicar = async (supabase: SupabaseClient, atual: Session | null) => {
      if (!atual?.user) {
        if (ativo) setAdmin(false);
        return;
      }
      const liberado = await confirmarAdmin(supabase, atual);
      if (ativo) setAdmin(liberado);
    };

    obterCliente()
      .then(async (supabase) => {
        if (!ativo) return;
        if (!supabase) {
          setReady(true);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (!ativo) return;
        setSession(data.session);
        await aplicar(supabase, data.session);
        if (!ativo) return;
        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
          setSession(next);
          void aplicar(supabase, next);
        });
        cancelar = () => sub.subscription.unsubscribe();
        setReady(true);
      })
      .catch(() => {
        if (ativo) setReady(true);
      });

    return () => {
      ativo = false;
      cancelar();
    };
  }, []);

  const perfil = useMemo(() => perfilDe(session?.user ?? null), [session]);

  const value = useMemo<AuthValue>(
    () => ({
      ...perfil,
      papel: admin ? "Administrador" : session ? "Usuário" : perfil.papel,
      ready,
      admin,
      session,
      entrar: async (usuario, senha) => {
        if (!usuario.trim() || !senha) return "Informe usuário e senha.";
        const supabase = await obterCliente();
        if (!supabase) return "Não foi possível entrar. Tente novamente.";
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTecnico(usuario),
          password: senha,
        });
        if (!error) return null;
        return mensagemLogin(error.message, error.code ?? "");
      },
      sair: async () => {
        const supabase = await obterCliente();
        if (supabase) await supabase.auth.signOut();
        setSession(null);
        setAdmin(false);
      },
      trocarSenha: async (senha, confirmacao) => {
        if (!senha.trim() || !confirmacao.trim()) return "Informe a nova senha nos dois campos.";
        if (senha !== confirmacao) return "As senhas não coincidem.";
        const senhaInvalida = mensagemSenhaInvalida(senha);
        if (senhaInvalida) return senhaInvalida;
        const supabase = await obterCliente();
        if (!supabase) return "Não foi possível concluir a troca. Tente novamente.";
        const { error } = await supabase.auth.updateUser({
          password: senha,
          data: { must_change_password: false },
        });
        if (error) return "Não foi possível concluir a troca. Tente novamente.";
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) await concluirPrimeiroAcesso({ data: { accessToken: token } });
        const refreshed = await supabase.auth.refreshSession();
        const atual = refreshed.data.session ?? data.session ?? null;
        setSession(atual);
        if (perfilDe(atual?.user ?? null).mustChange) {
          return "Não foi possível concluir a troca. Tente novamente.";
        }
        return null;
      },
    }),
    [admin, perfil, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}