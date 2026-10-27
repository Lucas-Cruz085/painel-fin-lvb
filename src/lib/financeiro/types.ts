export type Modo = "receber" | "pagar";
export type StatusTitulo = "a_vencer" | "atraso" | "liquidado";

export type Titulo = {
  parte: string; // cliente ou fornecedor
  projeto: string;
  documento: string;
  emissao: string; // yyyy-mm-dd
  vencimento: string;
  valor: number;
  status: StatusTitulo;
  diasAtraso: number;
};

export type Filtros = {
  inicio?: string | undefined;
  fim?: string | undefined;
  parte?: string | undefined;
  projeto?: string | undefined;
  status?: StatusTitulo | "" | undefined;
};

export type Kpi = {
  id: string;
  label: string;
  valor: number;
  formato: "brl" | "pct";
  cor: "blue" | "green" | "orange" | "red";
  variacao: number;
  variacaoSufixo: "%" | "p.p.";
  legenda: string;
  bomQuandoSobe: boolean;
};

export type PainelFinanceiro = {
  modo: Modo;
  dataReferencia: string;
  atualizadoEm: string;
  opcoes: { partes: string[]; projetos: string[] };
  kpis: Kpi[];
  porVencimento: { mes: string; aVencer: number; vencido: number; liquidado: number }[];
  status: { id: StatusTitulo; nome: string; valor: number; pct: number }[];
  projecao: { mes: string; previsto: number; saldo: number }[];
  detalhado: Titulo[];
  ranking: { nome: string; valor: number }[];
  porProjeto: { nome: string; valor: number; pct: number }[];
  aging: { faixa: string; valor: number }[];
  fluxoCaixa: { mes: string; entrada: number; saida: number; saldo: number }[];
};
