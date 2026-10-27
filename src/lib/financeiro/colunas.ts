import { brl, dataBR } from "@/lib/format";
import type { StatusTitulo, Titulo } from "./types";

export type FiltroColunas = {
  documento: string;
  parte: string;
  projeto: string;
  emissao: string;
  vencimento: string;
  valor: string;
  status: StatusTitulo | "";
};

export const FILTRO_COLUNAS_VAZIO: FiltroColunas = {
  documento: "",
  parte: "",
  projeto: "",
  emissao: "",
  vencimento: "",
  valor: "",
  status: "",
};

export function temFiltroColuna(filtro: FiltroColunas) {
  return Object.values(filtro).some((valor) => valor !== "");
}

function casa(texto: string, busca: string) {
  const q = busca.trim().toLowerCase();
  return q.length === 0 || texto.toLowerCase().includes(q);
}

function casaData(iso: string, busca: string) {
  const q = busca.trim().toLowerCase();
  if (!q) return true;
  return dataBR(iso).toLowerCase().includes(q) || iso.includes(q);
}

function numeroBusca(busca: string) {
  const limpo = busca.replace(/r\$/g, "").replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(limpo)) return null;
  const normal = limpo.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(limpo)
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

function casaValor(valor: number, busca: string) {
  const q = busca.trim().toLowerCase();
  if (!q) return true;
  if (brl(valor).toLowerCase().includes(q)) return true;
  const n = numeroBusca(q);
  return n !== null && Math.round(valor * 100) === Math.round(n * 100);
}

export function filtrarPorColunas(titulos: Titulo[], filtro: FiltroColunas) {
  return titulos.filter(
    (t) =>
      casa(t.documento, filtro.documento) &&
      casa(t.parte, filtro.parte) &&
      casa(t.projeto, filtro.projeto) &&
      casaData(t.emissao, filtro.emissao) &&
      casaData(t.vencimento, filtro.vencimento) &&
      casaValor(t.valor, filtro.valor) &&
      (!filtro.status || t.status === filtro.status),
  );
}