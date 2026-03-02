import { useState, useCallback } from "react";
import { motion, useCycle } from "framer-motion";

const INHALE_S = 4;
const EXHALE_S = 4;

export default function App() {
  const [phrase, setPhrase] = useState("");
  const [committed, setCommitted] = useState(false);
  const [phase, cyclePhase] = useCycle<"inhale" | "exhale">("inhale", "exhale");

  const handleCommit = useCallback(() => {
    setCommitted(true);
  }, []);

  const handleReset = useCallback(() => {
    setCommitted(false);
    setPhrase("");
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg)]">
      {/* Breathing orb */}
      <motion.div
        className="relative flex items-center justify-center"
        onAnimationComplete={() => cyclePhase()}
      >
        <motion.div
          className="h-[min(72vw,72vh)] w-[min(72vw,72vh)] rounded-full border border-[var(--orb)] bg-[var(--orb)] shadow-[0_0_80px_var(--orb-glow)]"
          initial={{ scale: 0.52, opacity: 0.2 }}
          animate={{
            scale: phase === "inhale" ? 1 : 0.52,
            opacity: phase === "inhale" ? 0.4 : 0.2,
          }}
          transition={{
            duration: phase === "inhale" ? INHALE_S : EXHALE_S,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Focus phrase: show input until committed, then show phrase on exhale */}
      <div className="absolute bottom-[20%] left-0 right-0 flex flex-col items-center gap-4 px-6">
        {!committed ? (
          <>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCommit()}
              placeholder="One thing..."
              className="w-full max-w-sm border-0 border-b border-[var(--muted)] bg-transparent pb-2 text-center text-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--text)] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCommit}
              className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              Lock in
            </button>
          </>
        ) : (
          <>
            <motion.p
              key={phase}
              className="max-w-md text-center text-[var(--text)]/90"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {phrase || "Breathe."}
            </motion.p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
            >
              Change
            </button>
          </>
        )}
      </div>

      {/* Cycle timer hint */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <CycleIndicator phase={phase} />
      </div>
    </div>
  );
}

function CycleIndicator({ phase }: { phase: "inhale" | "exhale" }) {
  return (
    <motion.span
      className="text-xs uppercase tracking-widest text-[var(--muted)]"
      key={phase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {phase === "inhale" ? "Inhale" : "Exhale"}
    </motion.span>
  );
}
