import { PartyPopper } from 'lucide-react';
import { useMemo } from 'react';
import { seededRandom } from '../game/random.ts';
import { Modal } from './Modal.tsx';
import { Button } from './ui.tsx';

const COLORS = ['var(--color-sad)', 'var(--color-calm)', 'var(--color-warm)', 'var(--color-happy)', 'var(--color-perfect)'];
const PIECES = 48;

/** Confetti made of plain elements; the pattern is seeded by the milestone, so it is the same every time. */
function Confetti({ seed }: { seed: number }) {
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

/** Every hundredth sentence: the 2018 version's congratulations, with confetti unless motion is reduced. */
export function Celebration({ milestone, reducedMotion, onClose }: { milestone: number; reducedMotion: boolean; onClose: () => void }) {
  return (
    <>
      {!reducedMotion && <Confetti seed={milestone} />}
      <Modal title="恭喜！" onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <PartyPopper className="size-14 text-happy" aria-hidden="true" />
          <p className="text-lg">
            你已經判斷了 <b className="text-mood font-display text-3xl">{milestone}</b> 句！
          </p>
          <p className="text-slate-600 dark:text-slate-300">離下一個一百又更近一步了呢！</p>
          <Button variant="primary" onClick={onClose} className="w-full max-w-xs" data-autofocus>
            繼續
          </Button>
        </div>
      </Modal>
    </>
  );
}
