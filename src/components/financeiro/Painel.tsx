import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { ehRecorte, FILTRO_COLUNAS_VAZIO, filtrarPorColunas, getPainelFinanceiro, linhaDoRecorte, MODO_CONFIG, recorteDoGrafico, rotuloRecorte, STATUS_NOME, temFiltroColuna, titulosDoRecorte, type FiltroColunas, type Filtros, type Kpi, type Modo, type RecorteKpi } from "@/lib/financeiro";
import { brl, brlCompact, dataBR, dataHoraBR, pct } from "@/lib/format";
import { useAuth } from "@/lib/auth/session";

const COR: Record<Kpi["cor"], string> = {
  blue: "var(--ind-blue)", green: "var(--ind-green)", orange: "var(--ind-orange)", red: "var(--ind-red)",
};
const STATUS_COR = { a_vencer: "var(--ind-blue)", atraso: "var(--ind-red)", liquidado: "var(--ind-green)" } as const;
const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 },
  itemStyle: { color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--popover-foreground)" },
  formatter: (v: number) => brl(v),
};
const RADIANO = Math.PI / 180;

function rotuloRosca(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  pct?: number;
  payload?: { pct?: number };
}) {
  const doDado = props.payload?.pct;
  const valor = typeof props.pct === "number" ? props.pct : typeof doDado === "number" ? doDado : (props.percent ?? 0) * 100;
  if (valor < 8 || props.cx == null || props.cy == null) return null;
  const interno = props.innerRadius ?? 0;
  const externo = props.outerRadius ?? 0;
  const raio = interno + (externo - interno) * 0.52;
  const angulo = -(props.midAngle ?? 0) * RADIANO;
  return (
    <text
      x={props.cx + raio * Math.cos(angulo)}
      y={props.cy + raio * Math.sin(angulo)}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      stroke="rgba(0,0,0,0.55)"
      strokeWidth={3}
      paintOrder="stroke"
      fontSize={12}
      fontWeight={700}
    >
      {pct(valor)}
    </text>
  );
}

function DicaRosca({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number; payload?: { pct?: number } }>;
}) {
  const item = active ? payload?.[0] : undefined;
  if (!item) return null;
  const percentual = item.payload?.pct;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-card">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1 tabular-nums">{brl(Number(item.value ?? 0))}</p>
      {typeof percentual === "number" && <p className="font-semibold tabular-nums">{pct(percentual)}</p>}
    </div>
  );
}
const legenda = { fontSize: 12, color: "var(--foreground)" } as const;
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

export function Painel() {
  const { primeiroNome } = useAuth();
  const [modo, setModo] = useState<Modo>("receber");
  const [f, setF] = useState<Filtros>({});
  const [recorte, setRecorte] = useState<RecorteKpi | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["painel", modo, f],
    queryFn: () => getPainelFinanceiro(modo, f),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const cfg = MODO_CONFIG[modo];
  const set = (k: keyof Filtros, v: string) => setF((p) => ({ ...p, [k]: v || undefined }));
  const escolherRecorte = (id: string) => {
    if (!ehRecorte(id)) return;
    setRecorte((atual) => (atual === id ? null : id));
  };
  useEffect(() => {
    if (!recorte) return;
    listaRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [recorte]);
  const titulosLista = data ? titulosDoRecorte(data.detalhado, recorte) : [];
  const listaPainel = data ? (
    <div ref={listaRef} className="scroll-mt-24 space-y-3">
      <p className="text-sm font-medium text-foreground">{linhaDoRecorte(modo, recorte, f, titulosLista.length)}</p>
      <Detalhado
        key={`${modo}-${recorte ?? "todos"}`}
        titulos={titulosLista}
        modo={modo}
        titulo={recorte ? rotuloRecorte(modo, recorte) : `Títulos detalhados · ${cfg.aba}`}
        {...(recorte ? { onLimpar: () => setRecorte(null) } : {})}
      />
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Olá, {primeiroNome}</p>
            <p className="mt-1 text-sm text-muted-foreground">Indicadores e títulos do portal financeiro.</p>
            <p className="section-label mt-4">Painel</p>
            <h1 className="text-2xl font-bold text-foreground">{cfg.titulo}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <nav className="flex rounded-xl bg-muted p-1">
              {(["receber", "pagar"] as Modo[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setModo(m); setF({}); setRecorte(null); }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${modo === m ? "bg-brand text-brand-foreground shadow-brand" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {MODO_CONFIG[m].aba}
                </button>
              ))}
            </nav>
            {data && (
              <p className="text-xs text-muted-foreground">
                Referência {dataBR(data.dataReferencia)} · {isFetching ? "Atualizando…" : `Atualizado em ${dataHoraBR(data.atualizadoEm)}`} · Dados fictícios
              </p>
            )}
          </div>
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
          <button onClick={() => { setF({}); setRecorte(null); }} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted">
            <RotateCcw className="h-4 w-4" /> Limpar filtros
          </button>
        </section>

        {!data && isError ? (
          <div className="card-surface space-y-3 p-10 text-center text-sm text-muted-foreground">
            <p>Não foi possível carregar o painel.</p>
            <button type="button" onClick={() => refetch()} className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 font-medium text-foreground hover:bg-muted">
              Tentar novamente
            </button>
          </div>
        ) : !data ? (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : (
          <div className="space-y-6">
            {isError && (
              <p role="alert" className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
                Não foi possível atualizar. Exibindo a última leitura.
              </p>
            )}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.kpis.map((k) => <KpiCard key={k.id} k={k} ativo={recorte === k.id} onClick={() => escolherRecorte(k.id)} />)}
            </section>
            {recorte ? listaPainel : null}

            <section className="grid gap-4 lg:grid-cols-3">
              <Card title="Títulos por mês de vencimento" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.porVencimento}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" {...axis} />
                    <YAxis {...axis} tickFormatter={brlCompact} width={70} />
                    <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                    <Legend wrapperStyle={legenda} />
                    <Bar dataKey="aVencer" name="A Vencer" stackId="a" fill={STATUS_COR.a_vencer} cursor="pointer" onClick={() => escolherRecorte("avencer")} />
                    <Bar dataKey="vencido" name="Em Atraso" stackId="a" fill={STATUS_COR.atraso} cursor="pointer" onClick={() => escolherRecorte("atraso")} />
                    <Bar dataKey="liquidado" name={cfg.liquidado} stackId="a" fill={STATUS_COR.liquidado} radius={[6, 6, 0, 0]} cursor="pointer" onClick={() => escolherRecorte("liquidado")} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Distribuição por status">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.status} dataKey="valor" nameKey="nome" innerRadius={48} outerRadius={84} paddingAngle={2} stroke="var(--card)" strokeWidth={2} label={rotuloRosca} labelLine={false} isAnimationActive={false} style={{ cursor: "pointer" }} onClick={(entrada) => { const bruto = entrada as { id?: string; payload?: { id?: string } }; const alvo = recorteDoGrafico(bruto.id ?? bruto.payload?.id ?? ""); if (alvo) escolherRecorte(alvo); }}>
                      {data.status.map((s) => <Cell key={s.id} fill={STATUS_COR[s.id]} />)}
                    </Pie>
                    <Tooltip content={<DicaRosca />} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.status.map((s) => {
                    const alvo = recorteDoGrafico(s.id);
                    const ativo = alvo !== null && recorte === alvo;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => { if (alvo) escolherRecorte(alvo); }}
                          aria-pressed={ativo}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left hover:bg-muted ${ativo ? "bg-muted" : ""}`}
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COR[s.id] }} />{s.nome}
                          </span>
                          <span className="font-semibold text-foreground">{brlCompact(s.valor)} · {pct(s.pct)}</span>
                        </button>
                      </li>
                    );
                  })}
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
                    <Legend wrapperStyle={legenda} />
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
                    <Legend wrapperStyle={legenda} />
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

{!recorte ? listaPainel : null}
          </div>
        )}
    </div>
  );
}

function KpiCard({ k, ativo, onClick }: { k: Kpi; ativo: boolean; onClick: () => void }) {
  const sobe = k.variacao >= 0;
  const bom = sobe === k.bomQuandoSobe;
  const isShare = k.id === "avencer";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`card-surface relative h-full w-full overflow-hidden p-4 text-left transition-shadow cursor-pointer hover:ring-2 hover:ring-brand/70 ${ativo ? "ring-2 ring-brand" : ""}`}
    >
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
    </button>
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

function Tabela({
  cols,
  rows,
  filtros,
}: {
  cols: string[];
  rows: React.ReactNode[][];
  filtros?: React.ReactNode[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-table-head text-table-head-foreground">
          <tr>
            {cols.map((c, i) => (
              <th key={c} className={`px-3 py-2.5 align-bottom font-semibold ${i === 0 ? "text-left" : "text-right"}`}>
                <span className="block">{c}</span>
                {filtros?.[i] ? <div className="mt-1.5 font-normal">{filtros[i]}</div> : null}
              </th>
            ))}
          </tr>
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
const CAMPO_COLUNA =
  "h-8 w-full min-w-[7rem] rounded-lg border border-input bg-card px-2 text-left text-xs font-normal text-foreground outline-none focus:border-brand";

function statusColuna(valor: string): FiltroColunas["status"] {
  if (valor === "a_vencer" || valor === "atraso" || valor === "liquidado") return valor;
  return "";
}
function Detalhado({
  titulos,
  modo,
  titulo,
  onLimpar,
}: {
  titulos: import("@/lib/financeiro").Titulo[];
  modo: Modo;
  titulo: string;
  onLimpar?: () => void;
}) {
  const [pag, setPag] = useState(0);
  const [busca, setBusca] = useState("");
  const [col, setCol] = useState(FILTRO_COLUNAS_VAZIO);
  const nomes = STATUS_NOME(modo);
  const parte = MODO_CONFIG[modo].parte;
  const setColuna = <K extends keyof FiltroColunas>(chave: K, valor: FiltroColunas[K]) => {
    setCol((atual) => ({ ...atual, [chave]: valor }));
    setPag(0);
  };
  const lista = useMemo(() => {
    const q = busca.toLowerCase();
    const base = titulos.filter((t) => !q || t.documento.toLowerCase().includes(q) || t.parte.toLowerCase().includes(q));
    return filtrarPorColunas(base, col);
  }, [titulos, busca, col]);
  const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const p = Math.min(pag, total - 1);
  const fatia = lista.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
  const soma = lista.reduce((s, t) => s + t.valor, 0);

  return (
    <Card title={titulo}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input className="field max-w-xs" placeholder={`Buscar documento ou ${MODO_CONFIG[modo].parte.toLowerCase()}`} value={busca} onChange={(e) => { setBusca(e.target.value); setPag(0); }} />
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          {onLimpar && (
            <button type="button" onClick={onLimpar} className="font-semibold text-foreground underline">
              Ver todos
            </button>
          )}
          {temFiltroColuna(col) && (
            <button type="button" onClick={() => { setCol(FILTRO_COLUNAS_VAZIO); setPag(0); }} className="font-semibold text-foreground underline">
              Limpar colunas
            </button>
          )}
          {lista.length} títulos · {brl(soma)}
        </span>
      </div>
      <Tabela
        cols={["Documento", parte, "Projeto", "Emissão", "Vencimento", "Valor", "Status"]}
        filtros={[
          <input key="documento" aria-label="Filtrar documento" className={CAMPO_COLUNA} placeholder="contém" value={col.documento} onChange={(e) => setColuna("documento", e.target.value)} />,
          <input key="parte" aria-label={`Filtrar ${parte.toLowerCase()}`} className={CAMPO_COLUNA} placeholder="contém" value={col.parte} onChange={(e) => setColuna("parte", e.target.value)} />,
          <input key="projeto" aria-label="Filtrar projeto" className={CAMPO_COLUNA} placeholder="contém" value={col.projeto} onChange={(e) => setColuna("projeto", e.target.value)} />,
          <input key="emissao" aria-label="Filtrar emissão" className={CAMPO_COLUNA} placeholder="dd/mm/aaaa" value={col.emissao} onChange={(e) => setColuna("emissao", e.target.value)} />,
          <input key="vencimento" aria-label="Filtrar vencimento" className={CAMPO_COLUNA} placeholder="dd/mm/aaaa" value={col.vencimento} onChange={(e) => setColuna("vencimento", e.target.value)} />,
          <input key="valor" aria-label="Filtrar valor" className={CAMPO_COLUNA} placeholder="R$" value={col.valor} onChange={(e) => setColuna("valor", e.target.value)} />,
          <select key="status" aria-label="Filtrar status" className={CAMPO_COLUNA} value={col.status} onChange={(e) => setColuna("status", statusColuna(e.target.value))}>
            <option value="">Todos</option>
            {Object.entries(nomes).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select>,
        ]}
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
