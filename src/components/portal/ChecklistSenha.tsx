import { checklistSenha } from "@/lib/auth/senha-temporaria";

export function ChecklistSenha({ senha, tom = "painel" }: { senha: string; tom?: "auth" | "painel" }) {
  const apagado = tom === "auth" ? "text-auth-muted" : "text-muted-foreground";
  const aceso = tom === "auth" ? "text-[oklch(0.82_0.14_155)]" : "text-[var(--ind-green)]";
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {checklistSenha(senha).map((item) => (
        <li key={item.id} className={item.ok ? aceso : apagado} aria-label={`${item.rotulo}: ${item.ok ? "atende" : "falta"}`}>
          <span aria-hidden="true">{item.ok ? "✓" : "○"} </span>
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}