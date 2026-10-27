import type { Modo, StatusTitulo, Titulo } from "./types";

/** Dados fictícios determinísticos. Nenhum dado real do ERP. */
export const DATA_REFERENCIA = "2026-10-26";
export const ATUALIZADO_EM = "2026-10-26T08:00:00";

function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTES = [
  "Construtora Horizonte Ltda",
  "Agro Vale do Jaguaribe",
  "Mineração Serra Azul",
  "Terraplenagem Nordeste",
  "Locadora Atlântica",
  "Pavimentar Engenharia",
  "Usina Canaã",
  "Porto Seco Logística",
  "Vale Verde Agronegócio",
  "Construtora Mandacaru",
  "Cimentos Litoral",
  "Saneamento Costa Norte",
  "Obras Carnaúba",
];
const PROJETOS_RECEBER = ["Venda de Máquinas", "Locação", "Peças e Serviços", "Contratos de Manutenção", "Seminovos"];

const FORNECEDORES = [
  "Peças Industriais Alfa",
  "Transportadora Rota Norte",
  "Energia Sol Nascente",
  "Pneus Carajás",
  "Lubrificantes Atlas",
  "Seguradora Confiança",
  "Nexus Sistemas TI",
  "Facilities Brisa",
  "Imóveis Beira-Mar",
  "Consultoria Prisma",
  "Hidráulica Potiguar",
  "Metalúrgica Aracati",
];
const PROJETOS_PAGAR = ["Importação de Máquinas", "Operações", "Administrativo", "Oficina", "Comercial"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const REF = new Date(DATA_REFERENCIA + "T12:00:00Z");

function gerar(modo: Modo): Titulo[] {
  const r = prng(modo === "receber" ? 2026 : 7331);
  const partes = modo === "receber" ? CLIENTES : FORNECEDORES;
  const projetos = modo === "receber" ? PROJETOS_RECEBER : PROJETOS_PAGAR;
  const [min, max] = modo === "receber" ? [8000, 380000] : [5000, 260000];
  const prefixo = modo === "receber" ? "NF" : "FT";
  const out: Titulo[] = [];
  for (let i = 0; i < 150; i++) {
    // peso maior para os primeiros nomes, gera ranking realista
    const parte = partes[Math.floor(Math.pow(r(), 1.6) * partes.length)]!;
    const projeto = projetos[Math.floor(Math.pow(r(), 1.3) * projetos.length)]!;
    const emissao = new Date(Date.UTC(2026, 0, 1) + Math.floor(r() * 330) * 86400000);
    const venc = new Date(emissao.getTime() + (30 + Math.floor(r() * 61)) * 86400000);
    const valor = Math.round((min + Math.pow(r(), 2) * (max - min)) / 10) * 10;
    const vencido = venc < REF;
    const liquidado = vencido ? r() < 0.74 : r() < 0.06;
    const status: StatusTitulo = liquidado ? "liquidado" : vencido ? "atraso" : "a_vencer";
    const diasAtraso = status === "atraso" ? Math.round((REF.getTime() - venc.getTime()) / 86400000) : 0;
    out.push({
      parte,
      projeto,
      documento: `${prefixo}-${String(10450 + i * 7).padStart(6, "0")}`,
      emissao: iso(emissao),
      vencimento: iso(venc),
      valor,
      status,
      diasAtraso,
    });
  }
  return out.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

export const TITULOS: Record<Modo, Titulo[]> = {
  receber: gerar("receber"),
  pagar: gerar("pagar"),
};

/** Saldos e variações fictícias usados nos indicadores. */
export const PARAMETROS = {
  saldoInicialCaixa: 1_250_000,
  variacoes: {
    receber: { total: 8.4, liquidado: 12.1, atraso: -3.6, indice: -0.8 },
    pagar: { total: 5.2, liquidado: 9.7, atraso: 4.1, indice: 0.6 },
  },
} as const;
