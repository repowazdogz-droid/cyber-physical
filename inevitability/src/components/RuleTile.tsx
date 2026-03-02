import { motion } from "framer-motion";

type Props = {
  label: string;
  disabled?: boolean;
  remaining?: number;
  onClick: () => void;
  onRemove?: () => void;
  isPlaced?: boolean;
};

export function RuleTile({
  label,
  disabled,
  remaining = 1,
  onClick,
  onRemove,
  isPlaced,
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={isPlaced ? onRemove : onClick}
      disabled={disabled && !isPlaced}
      className="touch-target flex shrink-0 flex-col items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-left text-sm text-[var(--text)] transition hover:border-[var(--possible)] disabled:opacity-50"
      whileHover={!disabled || isPlaced ? { scale: 1.02 } : undefined}
      whileTap={{ scale: 0.98 }}
    >
      <span className="font-medium">{label}</span>
      {remaining >= 0 && !isPlaced && (
        <span className="font-mono text-xs text-[var(--muted)]">{remaining} left</span>
      )}
      {isPlaced && (
        <span className="text-xs text-[var(--inevitable)]">tap to remove</span>
      )}
    </motion.button>
  );
}
