import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/lib/auth/session";
import { encerrarAvisoReset, listarAvisosReset, type AvisoReset } from "@/lib/auth/avisos";
import { EVENTO_AVISOS, publicarAvisos } from "@/lib/auth/aviso-texto";

function quando(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function SinoAvisos() {
  const { admin, session } = useAuth();
  const navigate = useNavigate();
  const caixa = useRef<HTMLDivElement>(null);
  const [avisos, setAvisos] = useState<AvisoReset[]>([]);
  const [aberto, setAberto] = useState(false);
  const token = session?.access_token;

  useEffect(() => {
    if (!admin || !token) return;
    let ativo = true;
    const carregar = async () => {
      const resultado = await listarAvisosReset({ data: { accessToken: token } });
      if (ativo && resultado.ok) setAvisos(resultado.avisos);
    };
    void carregar();
    const id = window.setInterval(() => void carregar(), 20000);
    window.addEventListener("focus", carregar);
    window.addEventListener(EVENTO_AVISOS, carregar);
    return () => {
      ativo = false;
      window.clearInterval(id);
      window.removeEventListener("focus", carregar);
      window.removeEventListener(EVENTO_AVISOS, carregar);
    };
  }, [admin, token]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (event: MouseEvent) => {
      if (!caixa.current?.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  if (!admin) return null;

  const abrirReset = (aviso: AvisoReset) => {
    setAberto(false);
    void navigate({ to: "/usuarios", hash: `reset-${aviso.id}` });
  };

  const dispensar = async (aviso: AvisoReset) => {
    if (!token) return;
    const resultado = await encerrarAvisoReset({ data: { accessToken: token, id: aviso.id } });
    if (!resultado.ok) return;
    setAvisos((atual) => atual.filter((item) => item.id !== aviso.id));
    publicarAvisos();
  };

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-label={avisos.length ? `Avisos de troca de senha, ${avisos.length}` : "Avisos de troca de senha"}
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        {avisos.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.65rem] font-bold text-brand-foreground">
            {avisos.length > 9 ? "9+" : avisos.length}
          </span>
        )}
      </button>
      {aberto && (
        <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-border bg-card p-3 shadow-card">
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Troca de senha</p>
            <button
              type="button"
              aria-label="Fechar avisos"
              onClick={() => setAberto(false)}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {avisos.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">Nenhum pedido de troca de senha.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {avisos.map((aviso) => (
                <li key={aviso.id} className="relative rounded-xl border border-border px-3 py-3 pr-10">
                  <button
                    type="button"
                    aria-label={`Fechar aviso de ${aviso.nome}`}
                    onClick={() => void dispensar(aviso)}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-sm font-medium text-foreground">{aviso.texto}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {aviso.usuario}
                    {quando(aviso.pedidoEm) ? ` · ${quando(aviso.pedidoEm)}` : ""}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => abrirReset(aviso)}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Redefinir senha
                    </button>
                    <button
                      type="button"
                      onClick={() => void dispensar(aviso)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Dispensar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}