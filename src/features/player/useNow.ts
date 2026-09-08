import { useEffect, useState } from 'react';

/**
 * Returns Date.now(), re-rendering on each animation frame while `running`.
 * Timers derive their remaining time from this (rendered with rAF, PRD NFR).
 */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return now;
}
