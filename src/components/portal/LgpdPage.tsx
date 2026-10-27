import { Shield } from "lucide-react";
import { LGPD } from "@/lib/portal";

export function LgpdPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="card-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-brand">
            <Shield className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="section-label">Privacidade</p>
              <span className="rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-foreground">
                Rascunho
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{LGPD.titulo}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{LGPD.paragrafo}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {LGPD.blocos.map((bloco) => (
          <article key={bloco.rotulo} className="card-surface flex flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">{bloco.rotulo}</p>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">Rascunho</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">{bloco.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bloco.texto}</p>
          </article>
        ))}
      </div>

      <section className="card-surface border-brand/40 p-5 sm:p-6">
        <p className="section-label">Como pedir</p>
        <h3 className="mt-2 text-base font-semibold text-foreground">Pedido do titular</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Para acessar, corrigir ou questionar um dado pessoal ligado à sua conta ou a um título, fale com o
          administrador do sistema. O pedido será encaminhado ao encarregado quando o canal oficial estiver publicado.
          Enquanto este texto estiver marcado como rascunho, ele serve de orientação interna e ainda aguarda revisão
          jurídica.
        </p>
      </section>
    </div>
  );
}