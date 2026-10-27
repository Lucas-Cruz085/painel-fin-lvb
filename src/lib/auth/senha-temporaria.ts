const MAIUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz";
const NUMEROS = "23456789";
const ESPECIAIS = "!@#$%&*?";
const SEM_DIGITO = MAIUSCULAS + MINUSCULAS + ESPECIAIS;

export const REGRAS_SENHA =
  "Mínimo de 12 caracteres, com letras, números, caractere especial e ao menos uma maiúscula. Sem números em sequência.";

function indice(max: number, aleatorio?: (max: number) => number) {
  if (aleatorio) return aleatorio(max);
  const limite = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let valor = 0;
  do {
    crypto.getRandomValues(buf);
    valor = buf[0] ?? 0;
  } while (valor >= limite);
  return valor % max;
}

function sortear(conjunto: string, aleatorio?: (max: number) => number) {
  return conjunto.charAt(indice(conjunto.length, aleatorio));
}

function embaralhar(chars: string[], aleatorio?: (max: number) => number) {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = indice(i + 1, aleatorio);
    const atual = chars[i] ?? "";
    chars[i] = chars[j] ?? "";
    chars[j] = atual;
  }
  return chars;
}

export function temNumerosEmSequencia(senha: string) {
  for (let i = 0; i <= senha.length - 3; i += 1) {
    const a = senha.charCodeAt(i);
    const b = senha.charCodeAt(i + 1);
    const c = senha.charCodeAt(i + 2);
    const digito = (codigo: number) => codigo >= 48 && codigo <= 57;
    if (!digito(a) || !digito(b) || !digito(c)) continue;
    if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) return true;
  }
  return false;
}

export function mensagemSenhaInvalida(senha: string) {
  if (senha.length < 12) return "A senha precisa ter no mínimo 12 caracteres.";
  if (senha.length > 72) return "A senha pode ter no máximo 72 caracteres.";
  if (/\s/.test(senha)) return "A senha não pode ter espaços.";
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
    return "A senha precisa ter letras, números e caracteres especiais.";
  }
  if (!/[A-Z]/.test(senha)) return "A senha precisa ter pelo menos uma letra maiúscula.";
  if (temNumerosEmSequencia(senha)) return "A senha não pode ter números em sequência, como 123 ou 987.";
  return null;
}


export type ItemChecklistSenha = { id: string; rotulo: string; ok: boolean };

export function checklistSenha(senha: string): ItemChecklistSenha[] {
  const temTexto = senha.length > 0;
  return [
    { id: "tamanho", rotulo: "12 caracteres", ok: senha.length >= 12 && senha.length <= 72 },
    { id: "maiuscula", rotulo: "Maiúscula", ok: /[A-Z]/.test(senha) },
    { id: "numero", rotulo: "Número", ok: /[0-9]/.test(senha) },
    { id: "especial", rotulo: "Especial", ok: /[^A-Za-z0-9]/.test(senha) && !/\s/.test(senha) },
    { id: "sequencia", rotulo: "Sem sequência", ok: temTexto && !/\s/.test(senha) && !temNumerosEmSequencia(senha) },
  ];
}
export function senhaAtendePolitica(senha: string) {
  return mensagemSenhaInvalida(senha) === null;
}

export function senhaTemporaria(aleatorio?: (max: number) => number) {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const chars = embaralhar(
      [
        sortear(MAIUSCULAS, aleatorio),
        sortear(MINUSCULAS, aleatorio),
        sortear(ESPECIAIS, aleatorio),
        sortear(NUMEROS, aleatorio),
        sortear(NUMEROS, aleatorio),
        ...Array.from({ length: 7 }, () => sortear(SEM_DIGITO, aleatorio)),
      ],
      aleatorio,
    );
    const senha = chars.join("");
    if (senhaAtendePolitica(senha)) return senha;
  }
  return `${sortear(MAIUSCULAS, aleatorio)}${sortear(MINUSCULAS, aleatorio)}${sortear(ESPECIAIS, aleatorio)}${sortear(NUMEROS, aleatorio)}`.padEnd(12, "a");
}