import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ViewDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const lock = useRef(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const aplicar = (next: boolean) => {
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("normaq-theme", next ? "dark" : "light");
    setDark(next);
  };

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (lock.current) return;
    const next = !document.documentElement.classList.contains("dark");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      aplicar(next);
      return;
    }

    const doc = document as ViewDoc;
    if (!doc.startViewTransition) {
      lock.current = true;
      document.documentElement.classList.add("theme-fade");
      aplicar(next);
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-fade");
        lock.current = false;
      }, 720);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const raio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.documentElement.classList.toggle("vt-shrink", !next);
    lock.current = true;

    const transicao = doc.startViewTransition(() => aplicar(next));
    transicao.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: next
            ? [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`]
            : [`circle(${raio}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`],
        },
        {
          duration: 860,
          easing: "cubic-bezier(0.77, 0, 0.18, 1)",
          pseudoElement: next ? "::view-transition-new(root)" : "::view-transition-old(root)",
        },
      );
    });
    transicao.finished.finally(() => {
      document.documentElement.classList.remove("vt-shrink");
      lock.current = false;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema noturno"}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground hover:bg-muted"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Claro" : "Noturno"}
    </button>
  );
}