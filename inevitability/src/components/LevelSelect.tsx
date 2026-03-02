import { motion } from "framer-motion";
import { LEVELS } from "../game/levels";

const CHAPTERS: { title: string; start: number; end: number }[] = [
  { title: "Foundations", start: 1, end: 5 },
  { title: "Tension", start: 6, end: 10 },
  { title: "Mastery", start: 11, end: 15 },
  { title: "Free Play", start: 16, end: 20 },
];

type Props = {
  completedLevels: Map<number, { stars: number; rulesUsed: number }>;
  onSelectLevel: (id: number) => void;
  onBack: () => void;
};

export function LevelSelect({ completedLevels, onSelectLevel, onBack }: Props) {
  return (
    <main className="flex min-h-full flex-col overflow-auto">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="touch-target rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm"
        >
          Back
        </button>
        <h1 className="font-mono text-lg tracking-wider">LEVELS</h1>
        <div className="w-14" />
      </header>
      <div className="flex-1 space-y-8 p-6">
        {CHAPTERS.map((ch) => (
          <section key={ch.title}>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-[var(--muted)]">
              {ch.title}
            </h2>
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
              {LEVELS.filter((l) => l.id >= ch.start && l.id <= ch.end).map((level) => {
                const done = completedLevels.get(level.id);
                const stars = done?.stars ?? 0;
                const locked = level.id > 1 && !completedLevels.has(level.id - 1);

                return (
                  <motion.button
                    key={level.id}
                    type="button"
                    onClick={() => !locked && onSelectLevel(level.id)}
                    disabled={locked}
                    className="touch-target flex flex-col items-center justify-center rounded-full border-2 transition"
                    style={{
                      width: 52,
                      height: 52,
                      borderColor: done ? "var(--inevitable)" : "var(--border)",
                      background: locked ? "var(--impossible)" : done ? "rgba(255,215,0,0.2)" : "var(--card)",
                    }}
                    whileHover={!locked ? { scale: 1.08 } : undefined}
                    whileTap={!locked ? { scale: 0.95 } : undefined}
                  >
                    <span className="font-mono text-sm font-bold">{level.id}</span>
                    {stars > 0 && (
                      <span className="text-xs text-[var(--inevitable)]">
                        {"★".repeat(stars)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
