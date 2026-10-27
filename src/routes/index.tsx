import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/session";

export const Route = createFileRoute("/")({
  component: Inicio,
});

function Inicio() {
  const { ready, session, mustChange } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/auth", replace: true });
    else if (mustChange) navigate({ to: "/primeiro-acesso", replace: true });
    else navigate({ to: "/dashboard", replace: true });
  }, [ready, session, mustChange, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Carregando…</div>
  );
}