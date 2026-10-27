import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { textoDoAviso } from "@/lib/auth/aviso-texto";
import { senhaTemporaria } from "@/lib/auth/senha-temporaria";

export type AvisoReset = {
  id: string;
  usuario: string;
  nome: string;
  pedidoEm: string;
  texto: string;
};

type ResultadoAvisos = { ok: true; avisos: AvisoReset[] } | { ok: false; mensagem: string; avisos: [] };
type ResultadoPedido = { ok: true; mensagem: string } | { ok: false; mensagem: string };

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

function corpoDe(data: unknown) {
  return data != null && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

async function callerAdmin(admin: SupabaseClient, accessToken: string) {
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return { ok: false as const, mensagem: "Sessão inválida." };
  const { data: papeis, error: papelErro } = await admin.from("user_roles").select("role").eq("user_id", data.user.id);
  if (papelErro) return { ok: false as const, mensagem: "Não foi possível confirmar a permissão." };
  const liberado = (papeis ?? []).some((item) => item.role === "admin");
  if (!liberado) return { ok: false as const, mensagem: "Apenas administradores podem gerenciar usuários." };
  return { ok: true as const, userId: data.user.id };
}

function usuarioNormalizado(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function metaDe(valor: unknown) {
  return valor != null && typeof valor === "object" ? (valor as Record<string, unknown>) : {};
}

function nomeDe(meta: Record<string, unknown>, usuario: string) {
  const bruto = meta["nome"] ?? meta["full_name"];
  return typeof bruto === "string" && bruto.trim() ? bruto.trim() : usuario;
}

export const solicitarResetSenha = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return { usuario: usuarioNormalizado(corpoDe(data)["usuario"]) };
  })
  .handler(async ({ data }): Promise<ResultadoPedido> => {
    if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(data.usuario)) {
      return { ok: false, mensagem: "Informe o usuário no formato nome.sobrenome." };
    }
    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível enviar o pedido." };

    const { data: perfil, error } = await admin
      .from("profiles")
      .select("id, username, full_name")
      .eq("username", data.usuario)
      .maybeSingle();
    if (error || !perfil) return { ok: false, mensagem: "Não encontramos esse usuário." };

    const { data: atual, error: leitura } = await admin.auth.admin.getUserById(perfil.id);
    if (leitura || !atual.user) return { ok: false, mensagem: "Não encontramos esse usuário." };

    const meta = metaDe(atual.user.user_metadata);
    const anterior = typeof meta["senha_reset_pedido_em"] === "string" ? Date.parse(meta["senha_reset_pedido_em"]) : 0;
    if (anterior && Date.now() - anterior < 60_000) {
      return { ok: true, mensagem: "Os administradores já foram avisados sobre este pedido." };
    }

    const { error: atualiza } = await admin.auth.admin.updateUserById(perfil.id, {
      user_metadata: { ...meta, senha_reset_pedido_em: new Date().toISOString() },
    });
    if (atualiza) return { ok: false, mensagem: "Não foi possível enviar o pedido." };
    return { ok: true, mensagem: "Pedido enviado. Os administradores do portal foram avisados." };
  });

export const listarAvisosReset = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken };
  })
  .handler(async ({ data }): Promise<ResultadoAvisos> => {
    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível carregar os avisos.", avisos: [] };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem, avisos: [] };

    const avisos: AvisoReset[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data: lote, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { ok: false, mensagem: "Não foi possível carregar os avisos.", avisos: [] };
      const usuarios = lote.users ?? [];
      for (const user of usuarios) {
        const meta = metaDe(user.user_metadata);
        const pedidoEm = meta["senha_reset_pedido_em"];
        if (typeof pedidoEm !== "string" || !pedidoEm) continue;
        const usuario = (user.email ?? "").split("@")[0] || "usuário";
        const nome = nomeDe(meta, usuario);
        avisos.push({ id: user.id, usuario, nome, pedidoEm, texto: textoDoAviso(nome) });
      }
      if (usuarios.length < 200) break;
    }
    avisos.sort((a, b) => b.pedidoEm.localeCompare(a.pedidoEm));
    return { ok: true, avisos };
  });

type ResultadoRedefinicao = { ok: true; senha: string; mensagem: string } | { ok: false; mensagem: string };

export const redefinirSenha = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    const idBruto = corpoDe(data)["id"];
    const id = typeof idBruto === "string" ? idBruto.trim() : "";
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken, id };
  })
  .handler(async ({ data }): Promise<ResultadoRedefinicao> => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      return { ok: false, mensagem: "Usuário inválido." };
    }
    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível alterar a senha." };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem };

    const { data: atual, error: leitura } = await admin.auth.admin.getUserById(data.id);
    if (leitura || !atual.user) return { ok: false, mensagem: "Usuário não encontrado." };

    const senha = senhaTemporaria();
    const meta = metaDe(atual.user.user_metadata);
    meta["senha_reset_pedido_em"] = null;
    meta["must_change_password"] = true;
    const app = metaDe(atual.user.app_metadata);
    app["must_change_password"] = true;
    const { error } = await admin.auth.admin.updateUserById(data.id, {
      password: senha,
      app_metadata: app,
      user_metadata: meta,
    });
    if (error) return { ok: false, mensagem: "Não foi possível alterar a senha." };

    await admin
      .from("profiles")
      .update({ must_change_password: true, password_issued_at: new Date().toISOString() })
      .eq("id", data.id);

    return {
      ok: true,
      senha,
      mensagem: "Senha temporária gerada. Ela aparece uma única vez e a troca é obrigatória no próximo acesso.",
    };
  });

export const encerrarAvisoReset = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const accessToken = tokenDe(data);
    const idBruto = corpoDe(data)["id"];
    const id = typeof idBruto === "string" ? idBruto.trim() : "";
    if (!accessToken) throw new Error("Sessão inválida.");
    return { accessToken, id };
  })
  .handler(async ({ data }): Promise<ResultadoPedido> => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      return { ok: false, mensagem: "Aviso inválido." };
    }
    const admin = clienteServico();
    if (!admin) return { ok: false, mensagem: "Não foi possível dispensar o aviso." };
    const acesso = await callerAdmin(admin, data.accessToken);
    if (!acesso.ok) return { ok: false, mensagem: acesso.mensagem };
    const { data: atual, error: leitura } = await admin.auth.admin.getUserById(data.id);
    if (leitura || !atual.user) return { ok: false, mensagem: "Usuário não encontrado." };
    const meta = metaDe(atual.user.user_metadata);
    meta["senha_reset_pedido_em"] = null;
    const { error } = await admin.auth.admin.updateUserById(data.id, { user_metadata: meta });
    if (error) return { ok: false, mensagem: "Não foi possível dispensar o aviso." };
    return { ok: true, mensagem: "Aviso dispensado." };
  });
