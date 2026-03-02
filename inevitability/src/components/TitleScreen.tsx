import { motion } from "framer-motion";

type Props = { onBegin: () => void };

export function TitleScreen({ onBegin }: Props) {
  return (
    <main className="relative flex min-h-full flex-col items-center justify-center gap-12 overflow-hidden">
      <motion.div
        className="font-mono text-4xl tracking-[0.4em] text-white sm:text-5xl md:text-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        INEVITABILITY
      </motion.div>
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {["A", "B", "C", "D"].map((_, i) => (
          <motion.div
            key={i}
            className="h-4 w-4 rounded-full bg-[var(--possible)]"
            style={{ boxShadow: "0 0 20px var(--possible)" }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
      <motion.button
        type="button"
        onClick={onBegin}
        className="touch-target rounded-full border border-[var(--border)] bg-[var(--card)] px-8 py-3 font-medium text-[var(--text)] transition hover:border-[var(--possible)] hover:text-[var(--possible)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        TAP TO BEGIN
      </motion.button>
    </main>
  );
}
