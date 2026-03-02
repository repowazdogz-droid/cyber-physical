import { useMemo } from "react";
import { motion } from "framer-motion";

const STAR_COUNT = 80;

export function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        pulse: Math.random() > 0.6,
      })),
    []
  );

  return (
    <div className="star-field" aria-hidden>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className={`star ${s.pulse ? "pulse" : ""}`}
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: s.pulse ? [0.3, 0.8, 0.3] : 0.4 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
