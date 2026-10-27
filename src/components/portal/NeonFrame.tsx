import { useEffect, useState, type ReactNode } from "react";

export function NeonFrame({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div className={paused ? "neon-frame neon-paused w-full max-w-md" : "neon-frame w-full max-w-md"}>
      <div className="relative overflow-hidden rounded-[21px] border border-white/10 bg-auth-card p-7 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -left-8 -top-10 h-36 w-36 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}