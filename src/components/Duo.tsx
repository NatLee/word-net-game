import { ArrowLeft, Crown, EyeOff, House, RotateCcw } from 'lucide-react';
import { useEffect, useReducer, useRef } from 'react';
import { createDuo, duoRounds, duoSentence, matchWinner, reduceDuo, roundWinner, type DuoSession } from '../game/duo.ts';
import { TIER_INFO } from '../game/labels.ts';
import { formatScore, TIERS } from '../game/scoring.ts';
import { duoShareText } from '../game/share.ts';
import type { Sentence } from '../types.ts';
import { ShareButtons } from './Share.tsx';
import { Spectrum } from './Spectrum.tsx';
import { TIER_STYLE } from './tiers.ts';
import { Button } from './ui.tsx';

/** One colour per player, for names and round dots (ink shades keep text readable in both themes). */
const PLAYER = [
  { text: 'text-indigo-600 dark:text-indigo-300', dot: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { text: 'text-pink-600 dark:text-pink-300', dot: 'bg-pink-500', ring: 'ring-pink-500' },
] as const;

interface DuoProps {
  names: [string, string];
  queue: readonly Sentence[];
  url: string;
  /** Called once per revealed round, with both answers in the session. */
  onRound: (session: DuoSession) => void;
  /** Called once when the last round is over. */
  onFinish: (session: DuoSession) => void;
  onRematch: () => void;
  onHome: () => void;
}

/**
 * Two players, one device. The first player casts and the net hides; the second casts on the
 * same sentence; then both nets and the reference are revealed together.
 */
export function Duo({ names, queue, url, onRound, onFinish, onRematch, onHome }: DuoProps) {
  const [session, dispatch] = useReducer(reduceDuo, undefined, () => createDuo(names, queue));
  const sentence = duoSentence(session);
  const [a, b] = session.players;
  const revealed = session.phase === 'revealed';
  const current = session.players[session.turn];

  const callbacks = useRef({ onRound, onFinish });
  useEffect(() => {
    callbacks.current = { onRound, onFinish };
  });
  const reported = useRef(0);
  useEffect(() => {
    if (a.results.length <= reported.current) return;
    reported.current = a.results.length;
    callbacks.current.onRound(session);
  }, [a.results.length, session]);
  useEffect(() => {
    if (session.phase === 'finished') callbacks.current.onFinish(session);
  }, [session]);

  const slider = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (session.phase === 'guessing' ? slider.current : next.current)?.focus({ preventScroll: true });
  }, [session.phase, session.round, session.turn]);

  if (session.phase === 'finished') return <DuoEnd session={session} url={url} onRematch={onRematch} onHome={onHome} />;

  const resultA = revealed ? a.results.at(-1) : undefined;
  const resultB = revealed ? b.results.at(-1) : undefined;
  const winner = resultA && resultB ? roundWinner(resultA, resultB) : null;
  const best = resultA && resultB ? TIERS[Math.min(TIERS.indexOf(resultA.tier), TIERS.indexOf(resultB.tier))] : null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 sm:gap-7" aria-label="雙人對戰">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onHome} className="-ml-3 px-3">
          <ArrowLeft className="size-5" aria-hidden="true" />
          離開
        </Button>
        <div className="flex items-center gap-2" aria-label={`比分 ${a.name} ${a.score}，${b.name} ${b.score}`}>
          {session.players.map((p, i) => (
            <span
              key={i}
              className={`rounded-2xl px-3 py-1.5 text-center transition ${session.turn === i && !revealed ? `bg-white/80 ring-2 dark:bg-white/10 ${PLAYER[i].ring}` : 'bg-slate-900/5 dark:bg-white/5'}`}
            >
              <span className={`block max-w-24 truncate text-xs font-bold ${PLAYER[i].text}`}>{p.name}</span>
              <span className="font-display text-xl font-bold tabular-nums">{p.score}</span>
            </span>
          ))}
        </div>
      </div>

      <ol className="flex gap-1.5" aria-label={`第 ${session.round + 1} 句，共 ${duoRounds(session)} 句`}>
        {Array.from({ length: duoRounds(session) }, (_, i) => {
          const [ra, rb] = [a.results[i], b.results[i]];
          const w = ra && rb ? roundWinner(ra, rb) : undefined;
          const color = w === undefined ? (i === session.round ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-900/10 dark:bg-white/10') : w === null ? 'bg-slate-400' : PLAYER[w].dot;
          return <li key={i} className={`h-1.5 flex-1 rounded-full ${color}`} />;
        })}
      </ol>

      <article className="glass flex min-h-48 flex-col justify-center rounded-[2rem] px-6 py-8 text-center sm:min-h-56 sm:px-10">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">
          雙人對戰 · 第 {session.round + 1} / {duoRounds(session)} 句
        </p>
        <p key={sentence.id} className="animate-rise text-2xl leading-relaxed font-bold text-balance sm:text-4xl sm:leading-snug">
          {sentence.text}
        </p>
      </article>

      {!revealed && (
        <p className="flex items-center justify-center gap-2 text-center font-semibold" aria-live="polite">
          {session.turn === 1 && <EyeOff className="size-4 shrink-0 text-slate-500" aria-hidden="true" />}
          輪到 <span className={PLAYER[session.turn].text}>{current.name}</span> 撒網
          {session.turn === 1 && <span className="font-normal text-slate-500 dark:text-slate-400">（{a.name} 的網子先藏起來了）</span>}
        </p>
      )}

      <div className="px-1 pb-8">
        <Spectrum
          ref={slider}
          value={session.guess}
          onChange={(value) => dispatch({ type: 'move', value })}
          onNudge={(by) => dispatch({ type: 'nudge', by })}
          onCommit={() => dispatch({ type: 'lock' })}
          reveal={best ? { reference: sentence.score, tier: best } : null}
          nets={revealed ? [{ value: a.guess ?? 0, label: a.name }, { value: b.guess ?? 0, label: b.name }] : undefined}
        />
      </div>

      {revealed && resultA && resultB ? (
        <div className="glass animate-rise rounded-3xl p-5 sm:p-6">
          <p className="mb-3 flex items-center justify-center gap-2 text-center font-display text-2xl font-black">
            {winner === null ? (
              '平手！'
            ) : (
              <>
                <Crown className="size-6 text-happy" aria-hidden="true" />
                這句 <span className={PLAYER[winner].text}>{session.players[winner].name}</span> 贏！
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[resultA, resultB].map((r, i) => (
              <div key={i} className="rounded-2xl bg-slate-900/5 p-3 text-center dark:bg-white/5">
                <p className={`truncate text-sm font-bold ${PLAYER[i].text}`}>{session.players[i].name}</p>
                <p className={`font-display text-xl font-black ${TIER_STYLE[r.tier].text}`}>{TIER_INFO[r.tier].label}</p>
                <p className="font-display text-2xl font-black tabular-nums">+{r.points}</p>
                <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  猜 {formatScore(session.players[i].guess ?? 0)}｜差 {r.distance.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">參考分數 {formatScore(sentence.score)}</p>
          {sentence.note && <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">{sentence.note}</p>}
          <Button ref={next} variant="primary" onClick={() => dispatch({ type: 'next' })} className="mt-4 w-full">
            {session.round + 1 >= duoRounds(session) ? '看結果' : '下一句'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Button variant="primary" onClick={() => dispatch({ type: 'lock' })} className="w-full max-w-xs py-3.5 text-lg">
            {current.name}，撒網！
          </Button>
        </div>
      )}
      <div aria-live="polite" className="sr-only">
        {revealed && resultA && resultB && `參考分數 ${formatScore(sentence.score)}。${a.name} ${resultA.points} 分，${b.name} ${resultB.points} 分。${sentence.note ?? ''}`}
      </div>
    </section>
  );
}

function DuoEnd({ session, url, onRematch, onHome }: { session: DuoSession; url: string; onRematch: () => void; onHome: () => void }) {
  const winner = matchWinner(session);
  const [a, b] = session.players;
  const text = duoShareText([a.name, b.name], [a.score, b.score], winner, url);
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6" aria-labelledby="duo-title">
      <div className="glass animate-rise rounded-[2rem] p-6 text-center sm:p-8">
        <h2 id="duo-title" className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">
          雙人對戰
        </h2>
        <p className="mt-3 flex animate-pop items-center justify-center gap-2 font-display text-4xl font-black sm:text-5xl">
          {winner === null ? (
            '平手！'
          ) : (
            <>
              <Crown className="size-9 text-happy" aria-hidden="true" />
              <span className={PLAYER[winner].text}>{session.players[winner].name}</span> 贏了！
            </>
          )}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {session.players.map((p, i) => (
            <div key={i} className={`rounded-2xl p-4 ${winner === i ? `bg-white/70 ring-2 dark:bg-white/10 ${PLAYER[i].ring}` : 'bg-slate-900/5 dark:bg-white/5'}`}>
              <p className={`truncate font-bold ${PLAYER[i].text}`}>{p.name}</p>
              <p className="font-display text-4xl font-black tabular-nums">{p.score}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                贏 {p.wins} 句・最高連擊 {p.bestStreak}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <ShareButtons text={text} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" onClick={onRematch} className="flex-1" data-autofocus>
            <RotateCcw className="size-4" aria-hidden="true" />
            再來一場
          </Button>
          <Button onClick={onHome} className="flex-1">
            <House className="size-4" aria-hidden="true" />
            回首頁
          </Button>
        </div>
      </div>
      <ol className="flex flex-col gap-3" aria-label="每一句的結果">
        {session.queue.map((s, i) => (
          <li key={s.id} className="glass rounded-2xl p-4">
            <p className="font-medium">{s.text}</p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              參考 {formatScore(s.score)}｜{a.name} +{a.results[i]?.points ?? 0}｜{b.name} +{b.results[i]?.points ?? 0}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
