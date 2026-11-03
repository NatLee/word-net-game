import { useEffect, useRef, useState } from 'react';

/** Animates a number from its previous value to `target`; jumps straight there when `instant`. */
export function useCountUp(target: number, durationMs: number, instant: boolean): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (instant || start === target || typeof requestAnimationFrame !== 'function') {
      setShown(target);
      return;
    }
    let frame = 0;
    const began = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(start + (target - start) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      setShown(target);
    };
  }, [target, durationMs, instant]);

  return shown;
}
