"use client";

export type BuilderMode = "reader" | "builder";

interface BuilderToggleProps {
  mode: BuilderMode;
  onModeChange?: (mode: BuilderMode) => void;
}

export default function BuilderToggle({
  mode,
  onModeChange
}: BuilderToggleProps) {
  const isBuilder = mode === "builder";

  const handleToggle = () => {
    const next: BuilderMode = isBuilder ? "reader" : "builder";
    onModeChange?.(next);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("omega-builder-mode", next);
      } catch {
        // ignore storage errors
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center rounded-full border border-zinc-200/80 bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      aria-label={`Switch to ${isBuilder ? "Reader" : "Builder"} mode`}
    >
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] transition ${
          !isBuilder
            ? "bg-zinc-900 text-zinc-50"
            : "text-zinc-600"
        }`}
      >
        Reader
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] transition ${
          isBuilder
            ? "bg-zinc-900 text-zinc-50"
            : "text-zinc-600"
        }`}
      >
        Builder
      </span>
    </button>
  );
}

