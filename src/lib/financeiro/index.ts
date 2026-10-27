import { MODO_CONFIG, STATUS_NOME } from "./config";
import { ATUALIZADO_EM, DATA_REFERENCIA, PARAMETROS, TITULOS } from "./mock-data";
import type { Filtros, Modo, PainelFinanceiro, Titulo } from "./types";

export * from "./types";
export { MODO_CONFIG, STATUS_NOME } from "./config";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const sum = (xs: Titulo[]) => xs.reduce((s, t) => s + t.valor, 0);

export function aplicarFiltros(titulos: Titulo[], f: Filtros): Titulo[] {
  return titulos.filter(
    (t) =>
      (!f.inicio || t.vencimento >= f.inicio) &&
      (!f.fim || t.vencimento <= f.fim) &&
      (!f.parte || t.parte === f.parte) &&
      (!f.projeto || t.projeto === f.projeto) &&
      (!f.status || t.status === f.status),
  );
}

/** Monta o painel a partir de uma lista de títulos: todas as somas derivam da mesma base. */
export function montarPainel(modo: Modo, todos: Titulo[], outros: Titulo[], f: Filtros): PainelFinanceiro {
  const cfg = MODO_CONFIG[modo];
  const nomes = STATUS_NOME(modo);
  const lista = aplicarFiltros(todos, f);
  const aVencer = lista.filter((t) => t.status === "a_vencer");
  const atraso = lista.filter((t) => t.status === "atraso");
  const liq = lista.filter((t) => t.status === "liquidado");
  const totAberto = sum(aVencer) + sum(atraso);
  const totGeral = totAberto + sum(liq);
  const v = PARAMETROS.variacoes[modo];
  const share = (x: number) => (totAberto ? (x / totAberto) * 100 : 0);
  const indice = share(sum(atraso));

  const kpis: PainelFinanceiro["kpis"] = [
    { id: "total", label: cfg.totalLabel, valor: totAberto, formato: "brl", cor: "blue", variacao: v.total, variacaoSufixo: "%", legenda: "vs mês anterior", bomQuandoSobe: modo === "receber" },
    { id: "liquidado", label: cfg.liquidadoLabel, valor: sum(liq), formato: "brl", cor: "green", variacao: v.liquidado, variacaoSufixo: "%", legenda: "vs mesmo período A/A", bomQuandoSobe: true },
    { id: "atraso", label: "Em Atraso", valor: sum(atraso), formato: "brl", cor: "red", variacao: v.atraso, variacaoSufixo: "%", legenda: "vs mês anterior", bomQuandoSobe: false },
    { id: "avencer", label: "A Vencer", valor: sum(aVencer), formato: "brl", cor: "blue", variacao: Math.round(share(sum(aVencer)) * 10) / 10, variacaoSufixo: "%", legenda: cfg.doTotal, bomQuandoSobe: true },
    { id: "indice", label: cfg.indiceLabel, valor: indice, formato: "pct", cor: "blue", variacao: v.indice, variacaoSufixo: "p.p.", legenda: "vs mês anterior", bomQuandoSobe: false },
  ];

  const porVencimento = MESES.map((mes, i) => {
    const doMes = lista.filter((t) => Number(t.vencimento.slice(5, 7)) === i + 1 && t.vencimento.startsWith("2026"));
    return {
      mes,
      aVencer: sum(doMes.filter((t) => t.status === "a_vencer")),
      vencido: sum(doMes.filter((t) => t.status === "atraso")),
      liquidado: sum(doMes.filter((t) => t.status === "liquidado")),
    };
  });

  const status = (["a_vencer", "atraso", "liquidado"] as const).map((id) => {
    const valor = sum(lista.filter((t) => t.status === id));
    return { id, nome: nomes[id], valor, pct: totGeral ? (valor / totGeral) * 100 : 0 };
  });

  // Projeção: 6 meses a partir da data de referência; atrasados entram no mês atual
  const ref = new Date(DATA_REFERENCIA + "T12:00:00");
  const sinal = modo === "receber" ? 1 : -1;
  let saldo = PARAMETROS.saldoInicialCaixa;
  const projecao = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() + k, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const previsto = sum(
      lista.filter(
        (t) => (t.status === "a_vencer" && t.vencimento.startsWith(chave)) || (k === 0 && t.status === "atraso"),
      ),
    );
    saldo += sinal * previsto;
    return { mes: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, previsto, saldo };
  });

  const agrupar = (key: "parte" | "projeto") => {
    const m = new Map<string, number>();
    lista.forEach((t) => m.set(t[key], (m.get(t[key]) ?? 0) + t.valor));
    return [...m.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  };

  const faixas: [string, number, number][] = [
    ["1–30", 1, 30],
    ["31–60", 31, 60],
    ["61–90", 61, 90],
    ["91–120", 91, 120],
    ["> 120", 121, Infinity],
  ];
  const aging = faixas.map(([faixa, a, b]) => ({
    faixa,
    valor: sum(atraso.filter((t) => t.diasAtraso >= a && t.diasAtraso <= b)),
  }));

  // Fluxo integrado: entradas (receber) x saídas (pagar), com filtro de período
  const fp = { inicio: f.inicio, fim: f.fim };
  const rec = aplicarFiltros(modo === "receber" ? todos : outros, fp);
  const pag = aplicarFiltros(modo === "pagar" ? todos : outros, fp);
  let saldoFluxo = PARAMETROS.saldoInicialCaixa;
  const fluxoCaixa = MESES.map((mes, i) => {
    const k = `2026-${String(i + 1).padStart(2, "0")}`;
    const entrada = sum(rec.filter((t) => t.vencimento.startsWith(k)));
    const saida = sum(pag.filter((t) => t.vencimento.startsWith(k)));
    saldoFluxo += entrada - saida;
    return { mes, entrada, saida, saldo: saldoFluxo };
  });

  const porProjetoBase = agrupar("projeto");
  return {
    modo,
    dataReferencia: DATA_REFERENCIA,
    atualizadoEm: ATUALIZADO_EM,
    opcoes: {
      partes: [...new Set(todos.map((t) => t.parte))].sort(),
      projetos: [...new Set(todos.map((t) => t.projeto))].sort(),
    },
    kpis,
    porVencimento,
    status,
    projecao,
    detalhado: lista,
    ranking: agrupar("parte").slice(0, 10),
    porProjeto: porProjetoBase.map((p) => ({ ...p, pct: totGeral ? (p.valor / totGeral) * 100 : 0 })),
    aging,
    fluxoCaixa,
  };
}

/**
 * Interface única da camada de dados. Hoje lê dados fictícios; depois será
 * trocada por uma função de servidor que consulta o ERP (somente leitura),
 * mantendo a mesma assinatura e o mesmo formato de retorno.
 */
export async function getPainelFinanceiro(modo: Modo, filtros: Filtros): Promise<PainelFinanceiro> {
  await new Promise((r) => setTimeout(r, 250));
  const outro: Modo = modo === "receber" ? "pagar" : "receber";
  return montarPainel(modo, TITULOS[modo], TITULOS[outro], filtros);
}
