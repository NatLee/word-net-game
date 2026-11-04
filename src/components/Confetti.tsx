import { useEffect, useMemo, useRef } from 'react';
import { seededRandom } from '../game/random.ts';

const COLORS = ['var(--color-sad)', 'var(--color-calm)', 'var(--color-warm)', 'var(--color-happy)', 'var(--color-perfect)'];
const PIECES = 48;
/** Matches --animate-confetti in index.css, plus the longest start delay. */
const DURATION_MS = 1800;

/**
 * A burst of confetti made of plain elements, for milestones and rank ups. The pattern comes
 * from `seed`, so it is the same every time; `onDone` runs once it has faded. The caller leaves
 * it out when the player asked for reduced motion.
 */
export function Confetti({ seed, onDone }: { seed: number; onDone: () => void }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const id = setTimeout(() => done.current(), DURATION_MS);
    return () => clearTimeout(id);
  }, [seed]);

  const pieces = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: PIECES }, (_, i) => {
      const angle = random() * Math.PI * 2;
      const reach = 120 + random() * 260;
      return {
        id: i,
        color: COLORS[i % COLORS.length],
        dx: `${Math.cos(angle) * reach}px`,
        dy: `${Math.sin(angle) * reach + 120}px`,
        spin: `${(random() - 0.5) * 900}deg`,
        delay: `${random() * 120}ms`,
        wide: random() > 0.5,
      };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute animate-confetti rounded-sm ${p.wide ? 'h-2 w-3.5' : 'h-3.5 w-2'}`}
          style={{ background: p.color, animationDelay: p.delay, ['--dx' as string]: p.dx, ['--dy' as string]: p.dy, ['--spin' as string]: p.spin }}
        />
      ))}
    </div>
  );
}
