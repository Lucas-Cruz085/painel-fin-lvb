import type { ReactNode } from "react";
import { BENEFICIOS, PORTAL } from "@/lib/portal";

export function AcessoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col text-auth-foreground">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/auth-bg.svg)" }} />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,oklch(0.07_0.02_262)_0%,oklch(0.08_0.02_262/94%)_40%,oklch(0.2_0.03_262/42%)_100%)]" />
      <div className="relative grid flex-1 lg:grid-cols-2">
        <aside className="hidden flex-col justify-between px-12 py-14 lg:flex xl:px-16">
          <div>
            <img src="/logo-horizontal.svg" alt="JCB NORMAQ" className="h-10 w-auto" />
            <p className="mt-10 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand">{PORTAL.selo}</p>
            <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">{PORTAL.titulo}</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-auth-muted">{PORTAL.paragrafo}</p>
            <ul className="mt-10 space-y-5">
              {BENEFICIOS.map((item) => (
                <li key={item.titulo} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                    <item.icone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.titulo}</span>
                    <span className="mt-1 block text-sm text-auth-muted">{item.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="flex flex-col items-center justify-center px-4 py-10">
          <img src="/logo-horizontal.svg" alt="JCB NORMAQ" className="mb-6 h-10 w-auto lg:hidden" />
          {children}
        </div>
      </div>
      <p className="relative px-4 pb-6 text-center text-xs text-auth-muted">
        Desenvolvido por Lucas Cruz | © 2026 NORMAQ - Todos os direitos reservados
      </p>
    </div>
  );
}