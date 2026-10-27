import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { getPainelFinanceiro, MODO_CONFIG, STATUS_NOME, type Filtros, type Kpi, type Modo } from "@/lib/financeiro";
import { brl, brlCompact, dataBR, dataHoraBR, pct } from "@/lib/format";
import { ThemeToggle } from "@/components/financeiro/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel Financeiro | NORMAQ JCB" },
      { name: "description", content: "Indicadores, gráficos e títulos de contas a pagar e a receber da NORMAQ JCB." },
      { property: "og:title", content: "Painel Financeiro | NORMAQ JCB" },
      { property: "og:description", content: "Indicadores, gráficos e títulos de contas a pagar e a receber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});

const COR: Record<Kpi["cor"], string> = {
  blue: "var(--ind-blue)", green: "var(--ind-green)", orange: "var(--ind-orange)", red: "var(--ind-red)",
};
const STATUS_COR = { a_vencer: "var(--ind-blue)", atraso: "var(--ind-red)", liquidado: "var(--ind-green)" } as const;
const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 },
  formatter: (v: number) => brl(v),
};
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

function Painel() {
  const [modo, setModo] = useState<Modo>("receber");
  const [f, setF] = useState<Filtros>({});
  const { data, isFetching } = useQuery({
    queryKey: ["painel", modo, f],
    queryFn: () => getPainelFinanceiro(modo, f),
    placeholderData: keepPreviousData,
  });
  const cfg = MODO_CONFIG[modo];
  const set = (k: keyof Filtros, v: string) => setF((p) => ({ ...p, [k]: v || undefined }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand px-2.5 py-1 text-sm font-extrabold text-brand-foreground">JCB</div>
            <div>
              <div className="text-sm font-bold tracking-wide text-foreground">NORMAQ</div>
              <div className="text-xs text-muted-foreground">Portal Financeiro</div>
            </div>
          </div>
          <nav className="flex rounded-xl bg-muted p-1">
            {(["receber", "pagar"] as Modo[]).map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setF({}); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${modo === m ? "bg-brand text-brand-foreground shadow-brand" : "text-muted-foreground hover:text-foreground"}`}
              >
                {MODO_CONFIG[m].aba}
              </button>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="section-label">Painel</p>
            <h1 className="text-2xl font-bold text-foreground">{cfg.titulo}</h1>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              Referência {dataBR(data.dataReferencia)} · Atualizado em {dataHoraBR(data.atualizadoEm)} · Dados fictícios
            </p>
          )}
        </div>

        <section className="card-surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs text-muted-foreground">Vencimento de
            <input type="date" className="field mt-1" value={f.inicio ?? ""} onChange={(e) => set("inicio", e.target.value)} />
          </label>
          <label className="text-xs text-muted-foreground">até
            <input type="date" className="field mt-1" value={f.fim ?? ""} onChange={(e) => set("fim", e.target.value)} />
          </label>
          <label className="text-xs text-muted-foreground">{cfg.parte}
            <select className="field mt-1" value={f.parte ?? ""} onChange={(e) => set("parte", e.target.value)}>
              <option value="">Todos</option>
              {data?.opcoes.partes.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Projeto
            <select className="field mt-1" value={f.projeto ?? ""} onChange={(e) => set("projeto", e.target.value)}>
              <option value="">Todos</option>
              {data?.opcoes.projetos.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Status
            <select className="field mt-1" value={f.status ?? ""} onChange={(e) => set("status", e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STATUS_NOME(modo)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button onClick={() => setF({})} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted">
            <RotateCcw className="h-4 w-4" /> Limpar filtros
          </button>
        </section>

        {!data ? (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : (
          <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.kpis.map((k) => <KpiCard key={k.id} k={k} />)}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card title="Títulos por mês de vencimento" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.porVencimento}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" {...axis} />
                    <YAxis {...axis} tickFormatter={brlCompact} width={70} />
                    <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="aVencer" name="A Vencer" stackId="a" fill={STATUS_COR.a_vencer} />
                    <Bar dataKey="vencido" name="Em Atraso" stackId="a" fill={STATUS_COR.atraso} />
                    <Bar dataKey="liquidado" name={cfg.liquidado} stackId="a" fill={STATUS_COR.liquidado} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Distribuição por status">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.status} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                      {data.status.map((s) => <Cell key={s.id} fill={STATUS_COR[s.id]} />)}
                    </Pie>
                    <Tooltip {...tip} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.status.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COR[s.id] }} />{s.nome}
                      </span>
                      <span className="font-semibold text-foreground">{brlCompact(s.valor)} · {pct(s.pct)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card title={`Projeção 6 meses · ${cfg.previsto}`}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={data.projecao}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" {...axis} />
                    <YAxis {...axis} tickFormatter={brlCompact} width={70} />
                    <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="previsto" name={cfg.previsto} fill="var(--brand)" radius={[6, 6, 0, 0]} />
                    <Line dataKey="saldo" name="Saldo projetado" stroke="var(--ind-blue)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Fluxo de caixa integrado (2026)">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.fluxoCaixa}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" {...axis} />
                    <YAxis {...axis} tickFormatter={brlCompact} width={70} />
                    <Tooltip {...tip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area dataKey="entrada" name="Entradas" stroke="var(--ind-green)" fill="var(--ind-green)" fillOpacity={0.15} />
                    <Area dataKey="saida" name="Saídas" stroke="var(--ind-red)" fill="var(--ind-red)" fillOpacity={0.15} />
                    <Area dataKey="saldo" name="Saldo" stroke="var(--ind-blue)" fill="none" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card title={cfg.ranking} className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.ranking} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" {...axis} tickFormatter={brlCompact} />
                    <YAxis type="category" dataKey="nome" {...axis} width={170} />
                    <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="valor" name="Valor" fill="var(--ind-blue)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Aging dos atrasados (dias)">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.aging}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="faixa" {...axis} />
                    <YAxis {...axis} tickFormatter={brlCompact} width={65} />
                    <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="valor" name="Em atraso" fill="var(--ind-red)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </section>

            <Card title="Resumo por projeto">
              <Tabela
                cols={["Projeto", "Valor", "% do total"]}
                rows={data.porProjeto.map((p) => [p.nome, brl(p.valor), pct(p.pct)])}
              />
            </Card>

            <Detalhado titulos={data.detalhado} modo={modo} />
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ k }: { k: Kpi }) {
  const sobe = k.variacao >= 0;
  const bom = sobe === k.bomQuandoSobe;
  const isShare = k.id === "avencer";
  return (
    <div className="card-surface relative overflow-hidden p-4">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: COR[k.cor] }} />
      <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
      <p className="mt-2 text-xl font-bold text-foreground">{k.formato === "brl" ? brl(k.valor) : pct(k.valor)}</p>
      <p className="mt-2 flex items-center gap-1 text-xs">
        {!isShare && (
          <span className="inline-flex items-center font-semibold" style={{ color: bom ? "var(--ind-green)" : "var(--ind-red)" }}>
            {sobe ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {sobe ? "+" : ""}{k.variacao.toLocaleString("pt-BR")}{k.variacaoSufixo === "%" ? "%" : " p.p."}
          </span>
        )}
        {isShare && <span className="font-semibold text-foreground">{pct(k.variacao)}</span>}
        <span className="text-muted-foreground">{k.legenda}</span>
      </p>
    </div>
  );
}

function Card({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`card-surface p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Tabela({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-table-head text-table-head-foreground">
          <tr>{cols.map((c, i) => <th key={c} className={`px-4 py-2.5 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-muted-foreground">Nenhum título encontrado.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border even:bg-muted/40">
              {r.map((c, j) => <td key={j} className={`px-4 py-2 text-foreground ${j === 0 ? "text-left" : "text-right"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const POR_PAGINA = 15;
function Detalhado({ titulos, modo }: { titulos: import("@/lib/financeiro").Titulo[]; modo: Modo }) {
  const [pag, setPag] = useState(0);
  const [busca, setBusca] = useState("");
  const nomes = STATUS_NOME(modo);
  const lista = useMemo(() => {
    const q = busca.toLowerCase();
    return titulos.filter((t) => !q || t.documento.toLowerCase().includes(q) || t.parte.toLowerCase().includes(q));
  }, [titulos, busca]);
  const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const p = Math.min(pag, total - 1);
  const fatia = lista.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
  const soma = lista.reduce((s, t) => s + t.valor, 0);

  return (
    <Card title={`Títulos detalhados · ${MODO_CONFIG[modo].aba}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input className="field max-w-xs" placeholder={`Buscar documento ou ${MODO_CONFIG[modo].parte.toLowerCase()}`} value={busca} onChange={(e) => { setBusca(e.target.value); setPag(0); }} />
        <span className="text-xs text-muted-foreground">{lista.length} títulos · {brl(soma)}</span>
      </div>
      <Tabela
        cols={["Documento", MODO_CONFIG[modo].parte, "Projeto", "Emissão", "Vencimento", "Valor", "Status"]}
        rows={fatia.map((t) => [
          t.documento,
          t.parte,
          t.projeto,
          dataBR(t.emissao),
          dataBR(t.vencimento),
          brl(t.valor),
          <span key="s" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: STATUS_COR[t.status] }}>
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COR[t.status] }} />
            {nomes[t.status]}{t.status === "atraso" ? ` (${t.diasAtraso}d)` : ""}
          </span>,
        ])}
      />
      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <button disabled={p === 0} onClick={() => setPag(p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-40">Anterior</button>
        <span className="text-muted-foreground">Página {p + 1} de {total}</span>
        <button disabled={p >= total - 1} onClick={() => setPag(p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-40">Próxima</button>
      </div>
    </Card>
  );
}
