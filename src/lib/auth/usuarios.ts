import { createServerFn } from "@tanstack/react-start";
import { mensagemSenhaInvalida } from "@/lib/auth/senha-temporaria";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UsuarioPortal = {
  id: string;
  usuario: string;
  nome: string;
  papel: "Administrador" | "Usuário";
};

type ResultadoLista =
  | { ok: true; usuarios: UsuarioPortal[] }
  | { ok: false; mensagem: string; usuarios: [] };

type ResultadoCriacao = { ok: true } | { ok: false; mensagem: string };

function clienteServico() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function tokenDe(data: unknown) {
  const token =
    data != null && typeof data === "object" && "accessToken" in data
      ? (data as { accessToken?: unknown }).accessToken
      : undefined;
  return typeof token === "string" && token.length >= 10 ? token : null;
}

async function callerAdmin(admin: SupabaseClient, accessToken: string) {
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return { ok: false as const, mensagem: "Sessão inválida." };
  const { data: papeis, error: papelErro } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  if (papelErro) return { ok: false as const, mensagem: "Não foi possível confirmar a permissão." };
  const liberado = (papeis ?? []).some((item) => item.role === "admin");
  if (!liberado) return { ok: false as const, mensagem: "Apenas administradores podem gerenciar usuários." };
  return { ok: true as const, userId: data.user.id };
}

function usuarioNormalizado(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

export const listarUsuarios = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken };
  })
  .handler(async ({ data }): Promise<ResultadoLista> => {
    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível carregar os usuários.", usuarios: [] };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem, usuarios: [] };

    const [{ data: perfis, error: perfilErro }, { data: papeis, error: papelErro }] = await Promise.all([
      admin.from("profiles").select("id, username, full_name").order("full_name"),
      admin.from("user_roles").select("user_id, role"),
    ]);
    if (perfilErro || papelErro) return { ok: false, mensagem: "Não foi possível carregar os usuários.", usuarios: [] };

    const admins = new Set((papeis ?? []).filter((item) => item.role === "admin").map((item) => item.user_id));
    const usuarios = (perfis ?? []).map((perfil) => ({
      id: perfil.id,
      usuario: perfil.username,
      nome: perfil.full_name?.trim() || perfil.username,
      papel: admins.has(perfil.id) ? ("Administrador" as const) : ("Usuário" as const),
    }));
    return { ok: true, usuarios };
  });

export const criarUsuario = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    const corpo = data != null && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const usuario = usuarioNormalizado(corpo["usuario"]);
    const nome = typeof corpo["nome"] === "string" ? corpo["nome"].trim() : "";
    const senha = typeof corpo["senha"] === "string" ? corpo["senha"] : "";
    const papel = corpo["papel"] === "admin" ? "admin" : corpo["papel"] === "usuario" ? "usuario" : "";
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken, usuario, nome, senha, papel };
  })
  .handler(async ({ data }): Promise<ResultadoCriacao> => {
    if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(data.usuario)) {
      return { ok: false, mensagem: "Use o formato nome.sobrenome, só com letras minúsculas e números." };
    }
    if (data.nome.length < 2 || data.nome.length > 120) {
      return { ok: false, mensagem: "Informe o nome completo." };
    }
    const senhaInvalida = mensagemSenhaInvalida(data.senha);
    if (senhaInvalida) return { ok: false, mensagem: senhaInvalida };
    if (data.papel !== "admin" && data.papel !== "usuario") {
      return { ok: false, mensagem: "Escolha o papel do usuário." };
    }

    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível incluir o usuário." };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem };

    const email = `${data.usuario}@normaq.local`;
    const { data: criado, error } = await admin.auth.admin.createUser({
      email,
      password: data.senha,
      email_confirm: true,
      app_metadata: { role: data.papel, must_change_password: false },
      user_metadata: { nome: data.nome, full_name: data.nome, must_change_password: false },
    });
    if (error || !criado.user) {
      const texto = error?.message.toLowerCase() ?? "";
      if (texto.includes("already") || texto.includes("registered") || texto.includes("exists")) {
        return { ok: false, mensagem: "Usuário já existe." };
      }
      return { ok: false, mensagem: "Não foi possível incluir o usuário." };
    }

    const { error: limpaPapel } = await admin.from("user_roles").delete().eq("user_id", criado.user.id);
    if (limpaPapel) return { ok: false, mensagem: "A conta foi criada, mas o papel não foi aplicado." };
    const { error: gravaPapel } = await admin.from("user_roles").insert({ user_id: criado.user.id, role: data.papel });
    if (gravaPapel) return { ok: false, mensagem: "A conta foi criada, mas o papel não foi aplicado." };

    await admin
      .from("profiles")
      .update({ username: data.usuario, full_name: data.nome, must_change_password: false })
      .eq("id", criado.user.id);

    return { ok: true };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    const corpo = data != null && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const id = typeof corpo["id"] === "string" ? corpo["id"].trim() : "";
    const nome = typeof corpo["nome"] === "string" ? corpo["nome"].trim() : "";
    const senha = typeof corpo["senha"] === "string" ? corpo["senha"] : "";
    const papel = corpo["papel"] === "admin" ? "admin" : corpo["papel"] === "usuario" ? "usuario" : "";
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken, id, nome, senha, papel };
  })
  .handler(async ({ data }): Promise<ResultadoCriacao> => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      return { ok: false, mensagem: "Usuário inválido." };
    }
    if (data.nome.length < 2 || data.nome.length > 120) {
      return { ok: false, mensagem: "Informe o nome completo." };
    }
    if (data.senha) {
      const senhaInvalida = mensagemSenhaInvalida(data.senha);
      if (senhaInvalida) return { ok: false, mensagem: senhaInvalida };
    }
    if (data.papel !== "admin" && data.papel !== "usuario") {
      return { ok: false, mensagem: "Escolha o papel do usuário." };
    }

    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível atualizar o usuário." };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem };
    if (acesso.userId === data.id && data.papel !== "admin") {
      return { ok: false, mensagem: "Você não pode remover o seu próprio acesso de administrador." };
    }

    const { data: atual, error: leitura } = await admin.auth.admin.getUserById(data.id);
    if (leitura || !atual.user) return { ok: false, mensagem: "Usuário não encontrado." };

    const metaUsuario: Record<string, unknown> = {
      ...(atual.user.user_metadata as Record<string, unknown>),
      nome: data.nome,
      full_name: data.nome,
    };
    if (data.senha) metaUsuario["senha_reset_pedido_em"] = null;
    const atributos: {
      password?: string;
      app_metadata: Record<string, unknown>;
      user_metadata: Record<string, unknown>;
    } = {
      app_metadata: { ...(atual.user.app_metadata as Record<string, unknown>), role: data.papel },
      user_metadata: metaUsuario,
    };
    if (data.senha) atributos.password = data.senha;
    const { error: atualizaAuth } = await admin.auth.admin.updateUserById(data.id, atributos);
    if (atualizaAuth) return { ok: false, mensagem: "Não foi possível atualizar o usuário." };

    const { error: limpaPapel } = await admin.from("user_roles").delete().eq("user_id", data.id);
    if (limpaPapel) return { ok: false, mensagem: "Os dados foram salvos, mas o papel não foi aplicado." };
    const { error: gravaPapel } = await admin.from("user_roles").insert({ user_id: data.id, role: data.papel });
    if (gravaPapel) return { ok: false, mensagem: "Os dados foram salvos, mas o papel não foi aplicado." };

    const { error: perfilErro } = await admin.from("profiles").update({ full_name: data.nome }).eq("id", data.id);
    if (perfilErro) return { ok: false, mensagem: "O acesso foi atualizado, mas o nome não foi salvo no perfil." };

    return { ok: true };
  });
