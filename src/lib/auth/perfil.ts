type Meta = { [key: string]: unknown };

export type UsuarioAuth = {
  email?: string | null;
  app_metadata?: Meta;
  user_metadata?: Meta;
};

export type PerfilAuth = {
  nome: string;
  primeiroNome: string;
  inicial: string;
  papel: "Administrador" | "Usuário";
  mustChange: boolean;
};

function texto(meta: Meta | undefined, chaves: string[]) {
  if (!meta) return undefined;
  for (const chave of chaves) {
    const valor = meta[chave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return undefined;
}

function flag(meta: Meta | undefined) {
  return meta?.["must_change_password"] === true;
}

export function perfilDe(user: UsuarioAuth | null): PerfilAuth {
  const nomeMeta = texto(user?.user_metadata, ["nome", "full_name", "name"]);
  const local = user?.email?.split("@")[0]?.replace(/\./g, " ").trim();
  const nome = nomeMeta || local || "Usuário";
  const parte = nome.split(/\s+/).filter(Boolean)[0] ?? "Usuário";
  const primeiroNome = parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1);
  const papelBruto = (
    texto(user?.app_metadata, ["role", "papel", "perfil"]) ??
    texto(user?.user_metadata, ["role", "papel", "perfil"]) ??
    ""
  ).toLowerCase();
  const papel =
    papelBruto === "admin" || papelBruto === "administrador" || papelBruto === "administrator"
      ? "Administrador"
      : "Usuário";
  return {
    nome,
    primeiroNome,
    inicial: primeiroNome.charAt(0).toLocaleUpperCase("pt-BR") || "U",
    papel,
    mustChange: flag(user?.app_metadata) || flag(user?.user_metadata),
  };
}