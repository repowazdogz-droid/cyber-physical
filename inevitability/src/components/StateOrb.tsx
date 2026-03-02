import { motion } from "framer-motion";

export type OrbStatus = "possible" | "inevitable" | "impossible";

type Props = {
  label: string;
  status: OrbStatus;
  index: number;
  total: number;
  selected?: boolean;
  onSelect?: () => void;
};

const RADIUS = 140;
const SIZE = 60;

export function StateOrb({ label, status, index, total, selected, onSelect }: Props) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const x = Math.cos(angle) * RADIUS;
  const y = Math.sin(angle) * RADIUS;

  const isInevitable = status === "inevitable";
  const isImpossible = status === "impossible";
  const isPossible = status === "possible";

  const size = isInevitable ? SIZE * 1.1 : isImpossible ? SIZE * 0.9 : SIZE;
  const color = isInevitable
    ? "var(--inevitable)"
    : isImpossible
      ? "var(--impossible)"
      : "var(--possible)";
  const shadow = isInevitable
    ? "0 0 24px var(--inevitable), 0 0 48px rgba(255,215,0,0.2)"
    : isImpossible
      ? "none"
      : "0 0 16px var(--possible)";

  return (
    <motion.button
      type="button"
      className="absolute flex touch-target select-none items-center justify-center rounded-full border-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--possible)]"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background: color,
        boxShadow: shadow,
      }}
      initial={false}
      animate={{
        scale: 1,
        opacity: isImpossible ? 0.6 : isPossible ? [0.85, 1, 0.85] : 1,
        boxShadow: shadow,
      }}
      whileHover={!isImpossible ? { scale: 1.08 } : undefined}
      whileTap={!isImpossible ? { scale: 0.98 } : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        opacity: isPossible
          ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 },
      }}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`State ${label}, ${status}`}
    >
      <motion.span
        className="font-mono text-sm font-bold"
        style={{
          color: isImpossible ? "#666" : "#0a0a0f",
          mixBlendMode: isImpossible ? "normal" : "darken",
        }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
