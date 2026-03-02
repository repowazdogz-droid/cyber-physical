// src/hooks/useUndo.ts
import { useCallback, useEffect, useRef } from "react";

export function useUndo<T>(onRestore: (v: T) => void) {
  const stackRef = useRef<T[]>([]);
  const enabledRef = useRef(true);

  const canUndo = () => stackRef.current.length > 0;

  const push = useCallback((snapshot: T) => {
    if (!enabledRef.current) return;
    stackRef.current.push(snapshot);
    if (stackRef.current.length > 50) stackRef.current.shift();
  }, []);

  const undo = useCallback(() => {
    const stack = stackRef.current;
    if (stack.length === 0) return;
    const prev = stack.pop() as T;
    // prevent restore from instantly re-pushing itself
    enabledRef.current = false;
    onRestore(prev);
    // re-enable on next tick
    setTimeout(() => {
      enabledRef.current = true;
    }, 0);
  }, [onRestore]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const z = e.key.toLowerCase() === "z";
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && z) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  return { push, undo, canUndo };
}
