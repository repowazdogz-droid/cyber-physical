import { motion } from "framer-motion";
import { StarRating } from "./StarRating";

type Props = {
  levelName: string;
  levelId: number;
  stars: number;
  par: number;
  rulesUsed: number;
  onNext: () => void;
  onLevelSelect: () => void;
};

export function LevelComplete({
  levelName,
  levelId,
  stars,
  par,
  rulesUsed,
  onNext,
  onLevelSelect,
}: Props) {
  const isLast = levelId >= 20;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex max-w-sm flex-col items-center gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
      >
        <p className="font-mono text-2xl tracking-widest text-[var(--inevitable)]">
          INEVITABLE
        </p>
        <p className="text-center text-[var(--text)]">
          Level {levelId}: {levelName}
        </p>
        <StarRating stars={stars} par={par} />
        <p className="text-sm text-[var(--muted)]">
          Solved with {rulesUsed} rule{rulesUsed !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onLevelSelect}
            className="touch-target rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm"
          >
            Level Select
          </button>
          {!isLast && (
            <button
              type="button"
              onClick={onNext}
              className="touch-target rounded-lg bg-[var(--inevitable)] px-4 py-2 text-sm font-medium text-[var(--bg)]"
            >
              Next Level
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
