import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, ScrollText, Shield, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/financeiro/ThemeToggle";
import { SinoAvisos } from "@/components/portal/SinoAvisos";
import { useAuth } from "@/lib/auth/session";
import { itensVisiveis, rotaRestrita } from "@/lib/auth/menu";
import { PORTAL } from "@/lib/portal";
import { cn } from "@/lib/utils";

const ICONES = {
  "/dashboard": LayoutDashboard,
  "/lgpd": Shield,
  "/logs": ScrollText,
  "/usuarios": Users,
} as const;

const TITULOS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/lgpd": "LGPD",
  "/logs": "Logs",
  "/usuarios": "Gestão de usuários",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, session, mustChange, admin, nome, inicial, papel, sair } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    setAberto(localStorage.getItem("normaq-menu") !== "recolhido");
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/auth", replace: true });
    else if (mustChange) navigate({ to: "/primeiro-acesso", replace: true });
    else if (!admin && rotaRestrita(pathname)) navigate({ to: "/dashboard", replace: true });
  }, [ready, session, mustChange, admin, pathname, navigate]);

  if (!ready || !session || mustChange) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Carregando…</div>
    );
  }

  const alternar = () => {
    setAberto((atual) => {
      const proximo = !atual;
      localStorage.setItem("normaq-menu", proximo ? "aberto" : "recolhido");
      return proximo;
    });
  };

  const sairPortal = async () => {
    await sair();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-screen flex-col bg-menu text-menu-foreground transition-[width] duration-200",
          aberto ? "w-72" : "w-20",
        )}
      >
        <div className="border-b border-menu-border px-3 py-3">
          <div className={cn("flex items-center gap-2", aberto ? "min-h-10" : "justify-center")}>
            {aberto ? (
              <>
                <img src="/logo-horizontal.svg" alt="JCB NORMAQ" className="h-9 w-auto rounded-lg bg-white" />
                <p className="min-w-0 flex-1 truncate text-xs text-menu-muted">{PORTAL.nome}</p>
              </>
            ) : (
              <img src="/favicon.svg" alt="NORMAQ" className="h-9 w-9" />
            )}
            {aberto && (
              <button
                type="button"
                onClick={alternar}
                aria-expanded={aberto}
                aria-label="Recolher menu"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-menu-muted hover:bg-menu-hover hover:text-menu-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          {!aberto && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={alternar}
                aria-expanded={aberto}
                aria-label="Expandir menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-menu-muted hover:bg-menu-hover hover:text-menu-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {itensVisiveis(admin).map((item) => {
            const Icone = ICONES[item.to];
            return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              activeOptions={{ exact: true }}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                aberto ? "px-3" : "justify-center",
              )}
              activeProps={{ className: "bg-brand text-brand-foreground shadow-brand" }}
              inactiveProps={{ className: "text-menu-muted hover:bg-menu-hover hover:text-menu-foreground" }}
            >
              <Icone className="h-5 w-5 shrink-0" />
              {aberto && <span>{item.label}</span>}
            </Link>
            );
          })}
        </nav>
        <div className="border-t border-menu-border p-3">
          <div className={cn("flex items-center gap-3", !aberto && "justify-center")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
              {inicial}
            </span>
            {aberto && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-menu-foreground">{nome}</p>
                <p className="text-xs text-menu-muted">{papel}</p>
              </div>
            )}
          </div>
          {aberto && <p className="mt-3 text-xs text-menu-muted">Desenvolvido por Lucas Cruz</p>}
        </div>
      </aside>
      <div className={cn("min-h-screen transition-[padding] duration-200", aberto ? "pl-72" : "pl-20")}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/80 px-6 backdrop-blur-md">
          <h1 className="truncate text-base font-semibold">{TITULOS[pathname] ?? PORTAL.nome}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {admin && <SinoAvisos />}
            <ThemeToggle />
            <button
              type="button"
              onClick={sairPortal}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>
        <main className="p-6 lg:p-8">{!admin && rotaRestrita(pathname) ? null : children}</main>
      </div>
    </div>
  );
}