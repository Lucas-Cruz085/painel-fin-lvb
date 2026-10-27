export const EVENTO_AVISOS = "normaq-avisos";

export function textoDoAviso(nome: string) {
  const limpo = nome.trim();
  return `${limpo || "Um usuário"} solicitou a troca de senha.`;
}

export function publicarAvisos() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_AVISOS));
}