import React from "react";

type Variant = "home" | "docs" | "packs" | "training" | "about" | "reflect";

const VARIANT: Record<Variant, { kicker: string; accent: string; bg: string }> = {
  home: { kicker: "Start here", accent: "from-blue-500/15 via-indigo-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-slate-50" },
  docs: { kicker: "Library", accent: "from-emerald-500/15 via-teal-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-emerald-50/40" },
  packs: { kicker: "Packs", accent: "from-violet-500/15 via-fuchsia-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-violet-50/35" },
  training: { kicker: "Training", accent: "from-amber-500/20 via-orange-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-amber-50/40" },
  about: { kicker: "About", accent: "from-slate-500/15 via-zinc-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-slate-50" },
  reflect: { kicker: "Reflect", accent: "from-teal-500/20 via-cyan-500/10 to-transparent", bg: "bg-gradient-to-br from-white to-teal-50/30" },
};

function IconStrip({ variant }: { variant: Variant }) {
  const base = "h-5 w-5 opacity-70";
  if (variant === "docs") return <div className="flex gap-2"><span className={base}>📚</span><span className={base}>🧭</span><span className={base}>🧩</span></div>;
  if (variant === "packs") return <div className="flex gap-2"><span className={base}>🧰</span><span className={base}>🗂️</span><span className={base}>✅</span></div>;
  if (variant === "training") return <div className="flex gap-2"><span className={base}>⚡</span><span className={base}>🗣️</span><span className={base}>🧠</span></div>;
  if (variant === "about") return <div className="flex gap-2"><span className={base}>🛡️</span><span className={base}>📌</span><span className={base}>🧾</span></div>;
  if (variant === "reflect") return <div className="flex gap-2"><span className={base}>🔍</span><span className={base}>🧠</span><span className={base}>🛡️</span></div>;
  return <div className="flex gap-2"><span className={base}>✨</span><span className={base}>🧱</span><span className={base}>🗺️</span></div>;
}

export function PageFrame(props: { variant: Variant; title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; }) {
  const v = VARIANT[props.variant];
  return (
    <div className={`rounded-2xl border border-border ${v.bg}`}>
      <div className="relative overflow-hidden rounded-2xl">
        <div className={`absolute inset-0 bg-gradient-to-r ${v.accent}`} />
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{v.kicker}</div>
              <span className="text-muted-foreground/60">•</span>
              <IconStrip variant={props.variant} />
            </div>
            {props.actions ? <div className="flex items-center gap-2">{props.actions}</div> : null}
          </div>
          <div className="mt-3">
            <h1 className="text-2xl font-semibold tracking-tight">{props.title}</h1>
            {props.subtitle ? <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground">{props.subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="mt-0">{props.children}</div>
      </div>
    </div>
  );
}

