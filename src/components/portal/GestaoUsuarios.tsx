import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, KeyRound, Pencil, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/session";
import { obterCliente } from "@/lib/auth/supabase";
import { atualizarUsuario, criarUsuario, listarUsuarios, type UsuarioPortal } from "@/lib/auth/usuarios";
import { listarAvisosReset, redefinirSenha, type AvisoReset } from "@/lib/auth/avisos";
import { publicarAvisos } from "@/lib/auth/aviso-texto";
import { mensagemSenhaInvalida } from "@/lib/auth/senha-temporaria";
import { ChecklistSenha } from "@/components/portal/ChecklistSenha";

const VAZIO = { usuario: "", nome: "", senha: "", confirmacao: "", papel: "usuario" as "usuario" | "admin" };

function CampoSenha({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  autoComplete: string;
}) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <span className="relative mt-1 block">
        <input
          className="field pr-11"
          type={mostrar ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          aria-label={mostrar ? `Ocultar ${label}` : `Mostrar ${label}`}
          onClick={() => setMostrar((atual) => !atual)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
        >
          {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export function GestaoUsuarios() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const hash = useRouterState({ select: (state) => state.location.hash });
  const formulario = useRef<HTMLElement>(null);
  const usuarioCadastro = useRef<HTMLInputElement>(null);
  const resetAberto = useRef("");
  const [lista, setLista] = useState<UsuarioPortal[]>([]);
  const [avisos, setAvisos] = useState<AvisoReset[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [cadastro, setCadastro] = useState(VAZIO);
  const [editando, setEditando] = useState<UsuarioPortal | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [resetando, setResetando] = useState<UsuarioPortal | null>(null);
  const [senhaGerada, setSenhaGerada] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [erroEdicao, setErroEdicao] = useState("");
  const [erroReset, setErroReset] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoEdicao, setEnviandoEdicao] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);
  const proprio = editando?.id === session?.user.id;

  const carregarAvisos = async (token: string) => {
    const resultado = await listarAvisosReset({ data: { accessToken: token } });
    if (resultado.ok) setAvisos(resultado.avisos);
  };

  const carregar = async () => {
    const token = session?.access_token;
    if (!token) return;
    setCarregando(true);
    const resultado = await listarUsuarios({ data: { accessToken: token } });
    if (resultado.ok) setLista(resultado.usuarios);
    else setErro(resultado.mensagem);
    await carregarAvisos(token);
    setCarregando(false);
  };

  useEffect(() => {
    void carregar();
  }, [session?.access_token]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    const atualizar = () => void carregarAvisos(token);
    window.addEventListener("normaq-avisos", atualizar);
    return () => window.removeEventListener("normaq-avisos", atualizar);
  }, [session?.access_token]);

  useEffect(() => {
    const bruto = hash.replace(/^#/, "");
    if (!bruto.startsWith("reset-")) return;
    const id = bruto.slice("reset-".length);
    if (resetAberto.current === id) return;
    const pessoa = lista.find((item) => item.id === id);
    if (!pessoa) return;
    resetAberto.current = id;
    setEditando(null);
    setResetando(pessoa);
    setSenhaGerada("");
    setCopiado(false);
    setErroReset("");
  }, [hash, lista]);

  const focarCadastro = () => {
    formulario.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    usuarioCadastro.current?.focus();
  };

  const iniciarEdicao = (pessoa: UsuarioPortal) => {
    setEditando(pessoa);
    setForm({
      usuario: pessoa.usuario,
      nome: pessoa.nome,
      senha: "",
      confirmacao: "",
      papel: pessoa.papel === "Administrador" ? "admin" : "usuario",
    });
    setErroEdicao("");
  };

  const iniciarReset = (pessoa: UsuarioPortal) => {
    resetAberto.current = pessoa.id;
    setEditando(null);
    setResetando(pessoa);
    setSenhaGerada("");
    setCopiado(false);
    setErroReset("");
  };

  const cancelarReset = () => {
    resetAberto.current = "";
    setResetando(null);
    setSenhaGerada("");
    setCopiado(false);
    setErroReset("");
    if (hash.replace(/^#/, "").startsWith("reset-")) {
      void navigate({ to: "/usuarios", hash: "", replace: true });
    }
  };

  const cadastrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro("");
    setAviso("");
    if (!cadastro.usuario.trim() || !cadastro.nome.trim() || !cadastro.senha) {
      setErro("Informe usuário, nome e senha.");
      return;
    }
    if (cadastro.senha !== cadastro.confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    const senhaInvalida = mensagemSenhaInvalida(cadastro.senha);
    if (senhaInvalida) {
      setErro(senhaInvalida);
      return;
    }
    const token = session?.access_token;
    if (!token) {
      setErro("Sessão inválida.");
      return;
    }
    setEnviando(true);
    const resultado = await criarUsuario({
      data: {
        accessToken: token,
        usuario: cadastro.usuario,
        nome: cadastro.nome,
        senha: cadastro.senha,
        papel: cadastro.papel,
      },
    });
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.mensagem);
      return;
    }
    setCadastro(VAZIO);
    setAviso("Usuário incluído. Ele já pode entrar com o usuário e a senha definidos.");
    await carregar();
  };

  const salvarEdicao = async (event: React.FormEvent) => {
    event.preventDefault();
    setErroEdicao("");
    if (!editando) return;
    if (form.nome.trim().length < 2) {
      setErroEdicao("Informe o nome completo.");
      return;
    }
    if (proprio && form.papel !== "admin") {
      setErroEdicao("Você não pode remover o seu próprio acesso de administrador.");
      return;
    }
    const token = session?.access_token;
    if (!token) {
      setErroEdicao("Sessão inválida.");
      return;
    }
    setEnviandoEdicao(true);
    const resultado = await atualizarUsuario({
      data: {
        accessToken: token,
        id: editando.id,
        nome: form.nome,
        senha: "",
        papel: form.papel,
      },
    });
    setEnviandoEdicao(false);
    if (!resultado.ok) {
      setErroEdicao(resultado.mensagem);
      return;
    }
    if (proprio) {
      const supabase = await obterCliente();
      if (supabase) await supabase.auth.refreshSession();
    }
    const nome = form.nome.trim();
    setEditando(null);
    setForm(VAZIO);
    setAviso(`Alterações de ${nome} salvas.`);
    await carregar();
  };

  const gerarSenha = async () => {
    setErroReset("");
    if (!resetando || senhaGerada) return;
    const token = session?.access_token;
    if (!token) {
      setErroReset("Sessão inválida.");
      return;
    }
    setEnviandoReset(true);
    const resultado = await redefinirSenha({ data: { accessToken: token, id: resetando.id } });
    setEnviandoReset(false);
    if (!resultado.ok) {
      setErroReset(resultado.mensagem);
      return;
    }
    setSenhaGerada(resultado.senha);
    setCopiado(false);
    publicarAvisos();
    await carregar();
  };

  const copiarSenha = async () => {
    if (!senhaGerada) return;
    try {
      await navigator.clipboard.writeText(senhaGerada);
      setCopiado(true);
      setErroReset("");
    } catch {
      setErroReset("Não foi possível copiar. Selecione a senha e copie manualmente.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Administração</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">Gestão de usuários</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Administradores cadastram usuários e editam acessos. Ao alterar a senha, o portal gera uma senha temporária, mostra uma única vez e exige a troca no próximo acesso.
          </p>
        </div>
        <button
          type="button"
          onClick={focarCadastro}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110"
        >
          <UserPlus className="h-4 w-4" />
          Cadastrar usuário
        </button>
      </div>

      <section ref={formulario} id="cadastro-usuario" className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
            <UserPlus className="h-5 w-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Cadastrar novo usuário</h3>
        </div>
        <form onSubmit={cadastrar} className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Usuário
            <input
              ref={usuarioCadastro}
              className="field mt-1"
              value={cadastro.usuario}
              placeholder="nome.sobrenome"
              autoComplete="off"
              onChange={(event) => setCadastro((atual) => ({ ...atual, usuario: event.target.value }))}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Nome
            <input
              className="field mt-1"
              value={cadastro.nome}
              autoComplete="off"
              onChange={(event) => setCadastro((atual) => ({ ...atual, nome: event.target.value }))}
            />
          </label>
          <CampoSenha
            label="Senha"
            value={cadastro.senha}
            autoComplete="new-password"
            onChange={(valor) => setCadastro((atual) => ({ ...atual, senha: valor }))}
          />
          <CampoSenha
            label="Confirmar senha"
            value={cadastro.confirmacao}
            autoComplete="new-password"
            onChange={(valor) => setCadastro((atual) => ({ ...atual, confirmacao: valor }))}
          />
          <div className="sm:col-span-2"><ChecklistSenha senha={cadastro.senha} /></div>
          <label className="text-xs text-muted-foreground">
            Papel
            <select
              className="field mt-1"
              value={cadastro.papel}
              onChange={(event) =>
                setCadastro((atual) => ({ ...atual, papel: event.target.value === "admin" ? "admin" : "usuario" }))
              }
            >
              <option value="usuario">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Cadastrar usuário"}
            </button>
          </div>
          {erro && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {erro}
            </p>
          )}
          {aviso && <p className="text-sm text-foreground sm:col-span-2">{aviso}</p>}
        </form>
      </section>

      {editando && (
        <section className="card-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
              <Pencil className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground">Editar acesso</h3>
              <p className="text-xs text-muted-foreground">{editando.usuario} — o usuário de login não muda.</p>
            </div>
          </div>
          <form onSubmit={salvarEdicao} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Usuário
              <input className="field mt-1 cursor-default opacity-70" value={form.usuario} readOnly aria-label="Usuário em edição" />
            </label>
            <label className="text-xs text-muted-foreground">
              Nome
              <input
                className="field mt-1"
                value={form.nome}
                aria-label="Nome em edição"
                onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Papel
              <select
                className="field mt-1 disabled:cursor-not-allowed disabled:opacity-70"
                value={form.papel}
                disabled={proprio}
                aria-label="Papel em edição"
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, papel: event.target.value === "admin" ? "admin" : "usuario" }))
                }
              >
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
              {proprio && <span className="mt-1 block">O seu papel de administrador permanece.</span>}
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={enviandoEdicao}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-60"
              >
                {enviandoEdicao ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
            {erroEdicao && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {erroEdicao}
              </p>
            )}
          </form>
        </section>
      )}

      {resetando && (
        <section className="card-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground">Alterar senha</h3>
              <p className="text-xs text-muted-foreground">
                {resetando.nome} ({resetando.usuario})
              </p>
            </div>
          </div>
          {senhaGerada ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Copie agora e envie por um canal reservado. Esta senha aparece uma única vez e não fica gravada. No próximo acesso, a troca é obrigatória.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={senhaGerada}
                  aria-label="Senha temporária"
                  className="field max-w-xs font-mono tracking-wide"
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => void copiarSenha()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110"
                >
                  <Copy className="h-4 w-4" />
                  {copiado ? "Copiada" : "Copiar"}
                </button>
              </div>
              <button
                type="button"
                onClick={cancelarReset}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A senha atual deixa de valer. O portal cria 12 caracteres com letras, números, caractere especial e ao menos uma maiúscula, sem números em sequência, e não grava o texto. Envie por um canal reservado. No próximo acesso, a troca é obrigatória.
              </p>
              {avisos.some((item) => item.id === resetando.id) && (
                <p className="text-sm text-foreground">Este usuário pediu a troca de senha. Ao gerar, o aviso sai do sino.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={enviandoReset}
                  onClick={() => void gerarSenha()}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-60"
                >
                  {enviandoReset ? "Gerando..." : "Gerar senha"}
                </button>
                <button
                  type="button"
                  onClick={cancelarReset}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {erroReset && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {erroReset}
            </p>
          )}
        </section>
      )}

      <section className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Usuário", "Nome", "Papel"].map((coluna) => (
                  <th key={coluna} className="px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {coluna}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              ) : lista.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                lista.map((pessoa) => {
                  const pediu = avisos.some((item) => item.id === pessoa.id);
                  const ativo = editando?.id === pessoa.id || resetando?.id === pessoa.id;
                  return (
                    <tr key={pessoa.id} className={`border-t border-border ${ativo ? "bg-brand/10" : ""}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{pessoa.usuario}</td>
                      <td className="px-4 py-3 text-foreground">
                        {pessoa.nome}
                        {pediu && <span className="mt-1 block text-xs font-semibold text-brand">Pediu troca de senha</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            pessoa.papel === "Administrador"
                              ? "inline-flex rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground"
                              : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                          }
                        >
                          {pessoa.papel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-label={`Editar ${pessoa.usuario}`}
                            onClick={() => iniciarEdicao(pessoa)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:border-brand hover:text-brand"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            aria-label={`Alterar senha de ${pessoa.usuario}`}
                            onClick={() => iniciarReset(pessoa)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:border-brand hover:text-brand"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Alterar senha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}