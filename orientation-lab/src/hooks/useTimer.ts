import { useEffect, useMemo, useRef, useState } from "react";

export function useTimer() {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);
  const lastTick = useRef<number | null>(null);

  const mmss = useMemo(() => {
    const s = Math.max(0, Math.floor(secondsLeft));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  useEffect(() => {
    if (!running) return;

    const tick = (t: number) => {
      if (lastTick.current == null) lastTick.current = t;
      const dt = (t - lastTick.current) / 1000;
      lastTick.current = t;

      setSecondsLeft((prev) => {
        const next = prev - dt;
        if (next <= 0) {
          // stop
          setRunning(false);
          lastTick.current = null;
          return 0;
        }
        return next;
      });

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      lastTick.current = null;
    };
  }, [running]);

  const start = (minutes: number) => {
    setSecondsLeft(Math.max(0, Math.floor(minutes * 60)));
    setRunning(true);
  };

  const pause = () => setRunning(false);
  const resume = () => {
    if (secondsLeft > 0) setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setSecondsLeft(0);
  };

  return { secondsLeft, running, mmss, start, pause, resume, reset };
}

