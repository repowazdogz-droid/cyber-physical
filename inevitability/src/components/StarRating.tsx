import { motion } from "framer-motion";

type Props = { stars: number; par: number; size?: "sm" | "md" };

export function StarRating({ stars, par, size = "md" }: Props) {
  const display = Math.min(3, Math.max(0, stars));
  const sizeClass = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="flex items-center gap-1" title={`${display} stars (par: ${par} rules)`}>
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className={i <= display ? "text-[var(--inevitable)]" : "text-[var(--border)]"}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
        >
          ★
        </motion.span>
      ))}
      <span className={`ml-1 font-mono ${sizeClass} text-[var(--muted)]`}>par {par}</span>
    </div>
  );
}
