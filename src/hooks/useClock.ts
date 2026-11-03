import { useEffect, useRef } from 'react';

/** How often the clock reports, in ms. Fine enough for a smooth bar, cheap enough for phones. */
const INTERVAL_MS = 100;

/** Calls `onTick(elapsedMs)` while `running`, measuring real time between calls. */
export function useClock(running: boolean, onTick: (elapsedMs: number) => void): void {
  const callback = useRef(onTick);
  useEffect(() => {
    callback.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      callback.current(now - last);
      last = now;
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [running]);
}
