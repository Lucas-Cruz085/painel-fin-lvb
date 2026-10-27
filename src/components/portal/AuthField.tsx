import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

export function AuthField({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  type: "text" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  const senha = type === "password";
  return (
    <label htmlFor={id} className="block text-sm text-auth-muted">
      {label}
      <span className="relative mt-1.5 block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-auth-muted" />
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={senha && !visivel ? "password" : "text"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-auth-border bg-auth-field pl-10 pr-11 text-sm text-auth-foreground outline-none transition-colors placeholder:text-auth-muted/70 focus:border-brand"
        />
        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((atual) => !atual)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-auth-muted hover:text-auth-foreground"
          >
            {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
    </label>
  );
}

export function RodapeCard({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-6 text-center text-xs leading-relaxed text-auth-muted">
      Painel Financeiro
      <span className="mx-1.5">·</span>
      Acesso monitorado
      <span className="mx-1.5">·</span>
      Desenvolvido por Lucas Cruz
      {children}
    </p>
  );
}