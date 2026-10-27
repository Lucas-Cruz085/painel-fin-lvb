import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { dataHoraBR } from "@/lib/format";
import { contarFiltros, filtrarLogs, REGISTROS, type FiltroLog } from "@/lib/logs";

const CHAVE = "normaq-logs-filtros";
const VAZIO: FiltroLog = {};

export function LogsPage() {
  const [aberto, setAberto] = useState(false);
  const [filtros, setFiltros] = useState<FiltroLog>(VAZIO);

  useEffect(() => {
    setAberto(localStorage.getItem(CHAVE) === "aberto");
  }, []);

  const lista = useMemo(() => filtrarLogs(REGISTROS, filtros), [filtros]);
  const ativos = contarFiltros(filtros);

  const alternar = () => {
    setAberto((atual) => {
      const proximo = !atual;
      localStorage.setItem(CHAVE, proximo ? "aberto" : "fechado");
      return proximo;
    });
  };

  const definir = (chave: keyof FiltroLog, valor: string) => {
    setFiltros((atual) => {
      const proximo: FiltroLog = { ...atual };
      if (valor.trim()) proximo[chave] = valor;
      else delete proximo[chave];
      return proximo;
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <p className="section-label">Auditoria</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Logs</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ações registradas no portal. A lista respeita o filtro mesmo com a faixa encolhida.</p>
      </div>

      <section className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="section-label">Filtros</p>
            {ativos > 0 && (
              <>
                <span className="text-xs font-medium text-foreground">
                  {ativos} {ativos === 1 ? "filtro" : "filtros"}
                </span>
                <button
                  type="button"
                  onClick={() => setFiltros(VAZIO)}
                  className="rounded-xl border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Limpar
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={alternar}
            aria-expanded={aberto}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            {aberto ? "Encolher" : "Expandir"}
            {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {aberto && (
          <div className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs text-muted-foreground">
              De
              <input type="datetime-local" className="field mt-1" value={filtros.de ?? ""} onChange={(e) => definir("de", e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">
              Até
              <input type="datetime-local" className="field mt-1" value={filtros.ate ?? ""} onChange={(e) => definir("ate", e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">
              Usuário
              <input className="field mt-1" value={filtros.usuario ?? ""} onChange={(e) => definir("usuario", e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">
              Ação
              <input className="field mt-1" value={filtros.acao ?? ""} onChange={(e) => definir("acao", e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">
              Detalhe
              <input className="field mt-1" value={filtros.detalhe ?? ""} onChange={(e) => definir("detalhe", e.target.value)} />
            </label>
          </div>
        )}
      </section>

      <section className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Data e hora", "Usuário", "Ação", "Detalhe"].map((coluna) => (
                  <th key={coluna} className="px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <ScrollText className="h-5 w-5" />
                    </span>
                    <p className="mt-4 font-medium text-foreground">
                      {ativos > 0 ? "Nenhum registro com esses filtros." : "Nenhum registro ainda."}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quando o portal registrar uma ação, ela aparece nesta tabela.
                    </p>
                  </td>
                </tr>
              ) : (
                lista.map((registro) => (
                  <tr key={`${registro.em}-${registro.usuario}-${registro.acao}`} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{dataHoraBR(registro.em)}</td>
                    <td className="px-4 py-3 text-foreground">{registro.usuario}</td>
                    <td className="px-4 py-3 text-foreground">{registro.acao}</td>
                    <td className="px-4 py-3 text-muted-foreground">{registro.detalhe}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}