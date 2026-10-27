export type RegistroLog = {
  em: string;
  usuario: string;
  acao: string;
  detalhe: string;
};

export type FiltroLog = {
  de?: string;
  ate?: string;
  usuario?: string;
  acao?: string;
  detalhe?: string;
};

export const REGISTROS: RegistroLog[] = [];

export function contarFiltros(f: FiltroLog) {
  return [f.de, f.ate, f.usuario, f.acao, f.detalhe].filter((v) => Boolean(v?.trim())).length;
}

export function filtrarLogs(lista: RegistroLog[], f: FiltroLog) {
  const usuario = f.usuario?.trim().toLowerCase() ?? "";
  const acao = f.acao?.trim().toLowerCase() ?? "";
  const detalhe = f.detalhe?.trim().toLowerCase() ?? "";
  const de = f.de ? new Date(f.de).getTime() : Number.NaN;
  const ate = f.ate ? new Date(f.ate).getTime() : Number.NaN;
  return lista.filter((r) => {
    const t = new Date(r.em).getTime();
    if (!Number.isNaN(de) && t < de) return false;
    if (!Number.isNaN(ate) && t > ate) return false;
    if (usuario && !r.usuario.toLowerCase().includes(usuario)) return false;
    if (acao && !r.acao.toLowerCase().includes(acao)) return false;
    if (detalhe && !r.detalhe.toLowerCase().includes(detalhe)) return false;
    return true;
  });
}