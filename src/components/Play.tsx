import { ArrowLeft, Flame, Heart, Lightbulb, Timer } from 'lucide-react';
import { useEffect, useReducer, useRef, type Ref } from 'react';
import { CLOCK_WARNING_SECONDS, MODES, RUSH_REVEAL_MS } from '../config.ts';
import { MODE_INFO, TIER_INFO } from '../game/labels.ts';
import { formatScore } from '../game/scoring.ts';
import { createSession, currentSentence, isLastRound, lastResult, reduce, totalRounds, type RoundResult, type Session } from '../game/session.ts';
import { useClock } from '../hooks/useClock.ts';
import { useCountUp } from '../hooks/useCountUp.ts';
import type { ModeId, Sentence } from '../types.ts';
import { Spectrum } from './Spectrum.tsx';
import { TIER_STYLE } from './tiers.ts';
import { Button } from './ui.tsx';

interface PlayProps {
  mode: ModeId;
  queue: readonly Sentence[];
  reducedMotion: boolean;
  /** Called once per locked-in guess. */
  onAnswer: (session: Session) => void;
  onFinish: (session: Session) => void;
  /** The player left before the end. */
  onQuit: (session: Session) => void;
}

export function Play({ mode, queue, reducedMotion, onAnswer, onFinish, onQuit }: PlayProps) {
  const [session, dispatch] = useReducer(reduce, undefined, () => createSession(mode, queue));
  const sentence = currentSentence(session);
  const result = session.phase === 'revealed' ? lastResult(session) : undefined;
  const timed = session.timeLeftMs !== null;

  // Report each answer and the end of the run to the app (records, sounds, the summary screen).
  const callbacks = useRef({ onAnswer, onFinish });
  useEffect(() => {
    callbacks.current = { onAnswer, onFinish };
  });
  const reported = useRef(0);
  useEffect(() => {
    if (session.results.length <= reported.current) return;
    reported.current = session.results.length;
    callbacks.current.onAnswer(session);
  }, [session]);
  useEffect(() => {
    if (session.phase === 'finished') callbacks.current.onFinish(session);
  }, [session]);

  // Timed mode: the clock runs while guessing; after a reveal the next sentence comes by itself.
  useClock(timed && session.phase === 'guessing', (ms) => dispatch({ type: 'tick', ms }));
  useEffect(() => {
    if (!timed || session.phase !== 'revealed') return;
    const id = setTimeout(() => dispatch({ type: 'next' }), RUSH_REVEAL_MS);
    return () => clearTimeout(id);
  }, [timed, session.phase, session.round]);

  // Keyboard flow: the slider has focus while guessing, the "next" button after the reveal.
  const slider = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (session.phase === 'guessing' ? slider.current : next.current)?.focus({ preventScroll: true });
  }, [session.phase, session.round]);

  const score = useCountUp(session.score, 600, reducedMotion);
  const total = totalRounds(session);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 sm:gap-7" aria-label={`${MODE_INFO[mode].title}模式`}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => onQuit(session)} className="-ml-3 px-3">
          <ArrowLeft className="size-5" aria-hidden="true" />
          離開
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          {session.streak >= 2 && (
            <span key={session.streak} className="flex animate-pop items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-600 dark:text-orange-300">
              <Flame className="size-4" aria-hidden="true" />
              連擊 {session.streak}
            </span>
          )}
          <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl" aria-label={`目前 ${session.score} 分`}>
            {score}
            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">分</span>
          </span>
        </div>
      </div>

      {session.timeLeftMs !== null ? (
        <TimeBar timeLeftMs={session.timeLeftMs} totalMs={(MODES[mode].seconds ?? 0) * 1000} />
      ) : session.lives !== null ? (
        <Hearts lives={session.lives} max={MODES[mode].lives ?? session.lives} />
      ) : (
        <ol className="flex gap-1.5" aria-label={`第 ${session.round + 1} 句，共 ${total} 句`}>
          {Array.from({ length: total ?? 0 }, (_, i) => {
            const done = session.results[i];
            const color = done ? TIER_STYLE[done.tier].bg : i === session.round ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-900/10 dark:bg-white/10';
            return <li key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${color}`} />;
          })}
        </ol>
      )}

      <article className="glass relative flex min-h-48 flex-col justify-center rounded-[2rem] px-6 py-8 text-center sm:min-h-56 sm:px-10">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {MODE_INFO[mode].title} · {total !== null ? `第 ${session.round + 1} / ${total} 句` : `第 ${session.round + 1} 句`}
        </p>
        <p key={sentence.id} className="animate-rise text-2xl leading-relaxed font-bold text-balance sm:text-4xl sm:leading-snug">
          {sentence.text}
        </p>
        {sentence.tags.length > 0 && (
          <p className="mt-4 flex flex-wrap justify-center gap-1.5">
            {sentence.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </p>
        )}
      </article>

      <div className="px-1 pb-8">
        <Spectrum
          ref={slider}
          value={session.guess}
          onChange={(value) => dispatch({ type: 'move', value })}
          onNudge={(by) => dispatch({ type: 'nudge', by })}
          onCommit={() => dispatch({ type: 'lock' })}
          reveal={result ? { reference: result.sentence.score, tier: result.tier } : null}
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {result && `${TIER_INFO[result.tier].label}！參考分數 ${formatScore(result.sentence.score)}，你猜 ${formatScore(result.guess)}，得到 ${result.points} 分。`}
      </div>

      {result ? (
        <Result result={result} last={isLastRound(session)} timed={timed} nextRef={next} onNext={() => dispatch({ type: 'next' })} />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Button variant="primary" onClick={() => dispatch({ type: 'lock' })} className="w-full max-w-xs py-3.5 text-lg">
            撒網！
          </Button>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">← → 移動網子 · 1–9 快速跳 · Enter 撒網</p>
        </div>
      )}
    </section>
  );
}

function Hearts({ lives, max }: { lives: number; max: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="img" aria-label={`剩下 ${lives} 顆心，共 ${max} 顆`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart
          key={i}
          className={`size-7 transition duration-300 ${i < lives ? 'fill-miss text-miss' : 'scale-75 text-slate-300 dark:text-slate-600'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function TimeBar({ timeLeftMs, totalMs }: { timeLeftMs: number; totalMs: number }) {
  const seconds = Math.ceil(timeLeftMs / 1000);
  const warn = seconds <= CLOCK_WARNING_SECONDS;
  return (
    <div className="flex items-center gap-3" role="timer" aria-label={`剩下 ${seconds} 秒`}>
      <Timer className={`size-5 ${warn ? TIER_STYLE.miss.text : 'text-slate-500'}`} aria-hidden="true" />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
        <div className="bg-mood h-full rounded-full" style={{ width: `${totalMs ? (timeLeftMs / totalMs) * 100 : 0}%` }} />
      </div>
      <span className={`w-10 text-right font-display text-lg font-bold tabular-nums ${warn ? TIER_STYLE.miss.text : ''}`}>{seconds}</span>
    </div>
  );
}

function Result({
  result,
  last,
  timed,
  nextRef,
  onNext,
}: {
  result: RoundResult;
  last: boolean;
  timed: boolean;
  nextRef: Ref<HTMLButtonElement>;
  onNext: () => void;
}) {
  const style = TIER_STYLE[result.tier];
  return (
    <div className={`glass animate-rise rounded-3xl p-5 ring-2 sm:p-6 ${style.ring} ${result.tier === 'miss' ? 'animate-shake' : ''}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className={`font-display text-3xl font-black tracking-tight sm:text-4xl ${style.text}`}>{TIER_INFO[result.tier].label}！</p>
          <p className="mt-1 text-sm text-slate-600 tabular-nums dark:text-slate-300">
            參考 {formatScore(result.sentence.score)}｜你 {formatScore(result.guess)}｜差距 {result.distance.toFixed(2)}
          </p>
        </div>
        <p className="animate-pop text-right font-display tabular-nums">
          <span className="text-4xl font-black">+{result.points}</span>
          {result.multiplier > 1 && (
            <span className="ml-2 text-sm font-semibold text-orange-600 dark:text-orange-300">
              {result.base} × {result.multiplier} 連擊
            </span>
          )}
        </p>
      </div>
      {result.lifeChange !== 0 && (
        <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${result.lifeChange < 0 ? TIER_STYLE.miss.text : TIER_STYLE.perfect.text}`}>
          <Heart className="size-4 fill-current" aria-hidden="true" />
          {result.lifeChange < 0 ? '失手，扣一顆心' : `連擊 ${result.streak}，補一顆心`}
        </p>
      )}
      {result.sentence.note && <p className="mt-3 flex gap-2 border-t border-slate-900/10 pt-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-near" aria-hidden="true" />
          {result.sentence.note}
        </p>}
      <div className="mt-4 flex items-center gap-3">
        <Button ref={nextRef} variant="primary" onClick={onNext} className="flex-1">
          {last ? '看結算' : '下一句'}
        </Button>
      </div>
      {timed && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10" aria-hidden="true">
          <div className="bg-mood h-full origin-left" style={{ animation: `shrink ${RUSH_REVEAL_MS}ms linear forwards` }} />
        </div>
      )}
    </div>
  );
}
