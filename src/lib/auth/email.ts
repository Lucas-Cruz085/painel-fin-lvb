export function emailTecnico(usuario: string) {
  const local = usuario.trim().toLowerCase().split("@")[0] ?? "";
  const limpo = local.replace(/[^a-z0-9._-]/g, "");
  return `${limpo}@normaq.local`;
}

export function mensagemLogin(message: string, code?: string) {
  const texto = `${code ?? ""} ${message}`.toLowerCase();
  if (
    texto.includes("email_not_confirmed") ||
    texto.includes("not confirmed") ||
    texto.includes("nao confirm") ||
    texto.includes("não confirm")
  ) {
    return "Usuário ainda não confirmado. Contate o administrador.";
  }
  if (
    texto.includes("invalid_credentials") ||
    texto.includes("invalid login") ||
    texto.includes("invalid_grant") ||
    texto.includes("credentials")
  ) {
    return "Usuário ou senha inválidos.";
  }
  return "Não foi possível entrar. Tente novamente.";
}