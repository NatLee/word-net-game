import { Award, ChevronsUp, House, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { Achievement } from '../game/achievements.ts';
import { TIER_INFO } from '../game/labels.ts';
import { percentOf } from '../game/scale.ts';
import type { Rank } from '../game/progress.ts';
import { formatScore } from '../game/scoring.ts';
import { summarize, type Session } from '../game/session.ts';
import { useCountUp } from '../hooks/useCountUp.ts';
import { ShareButtons } from './Share.tsx';
import { TIER_STYLE } from './tiers.ts';
import { Button } from './ui.tsx';

/** What the run earned beyond its score. */
export interface Gains {
  xp: number;
  /** The new rank, if the run reached one. */
  rank: Rank | null;
  achievements: readonly Achievement[];
}

interface SummaryProps {
  session: Session;
  title: string;
  shareText: string;
  /** True when this run tops the device leaderboard of its mode. */
  best: boolean;
  gains: Gains;
  /** Null when the mode can only be played once a day. */
  onAgain: (() => void) | null;
  onHome: () => void;
  reducedMotion: boolean;
}

export function Summary({ session, title, shareText, best, gains, onAgain, onHome, reducedMotion }: SummaryProps) {
  const summary = summarize(session);
  const score = useCountUp(summary.score, 1200, reducedMotion);
  const stats = [
    { label: '句數', value: String(summary.rounds) },
    { label: '平均差距', value: summary.averageDistance.toFixed(2) },
    { label: '最高連擊', value: String(summary.bestStreak) },
    { label: '完美', value: String(summary.perfects) },
  ];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6" aria-labelledby="summary-title">
      <div className="glass animate-rise rounded-[2rem] p-6 text-center sm:p-8">
        <p id="summary-title" className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="mt-2 font-display text-6xl font-black tabular-nums sm:text-7xl">
          <span className="text-mood">{score}</span>
          <span className="ml-2 text-xl font-semibold text-slate-500">分</span>
        </p>
        {best && (
          <p className="mx-auto mt-3 flex w-fit animate-pop items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300">
            <Trophy className="size-4" aria-hidden="true" />
            新紀錄！
          </p>
        )}
        <ul className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-semibold" aria-label="這一局的收穫">
          <li className="flex items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1 dark:bg-white/10">
            <Sparkles className="size-4" aria-hidden="true" />+{gains.xp} XP
          </li>
          {gains.rank && (
            <li className="bg-mood flex animate-pop items-center gap-1.5 rounded-full px-3 py-1 text-white">
              <ChevronsUp className="size-4" aria-hidden="true" />
              升到 Lv.{gains.rank.level} {gains.rank.title}
            </li>
          )}
          {gains.achievements.map((a) => (
            <li key={a.id} className="flex animate-pop items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-amber-800 dark:text-amber-200" title={a.description}>
              <Award className="size-4" aria-hidden="true" />
              {a.title}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-2xl tracking-[0.3em]" aria-label="每句的結果">
          {session.results.map((r, i) => (
            <span key={i} className={TIER_STYLE[r.tier].text} title={TIER_INFO[r.tier].label}>
              {TIER_INFO[r.tier].symbol}
            </span>
          ))}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-900/5 px-3 py-3 dark:bg-white/5">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{s.label}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <ShareButtons text={shareText} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {onAgain && (
            <Button variant="primary" onClick={onAgain} className="flex-1" data-autofocus>
              <RotateCcw className="size-4" aria-hidden="true" />
              再玩一次
            </Button>
          )}
          <Button onClick={onHome} className="flex-1">
            <House className="size-4" aria-hidden="true" />
            回首頁
          </Button>
        </div>
      </div>

      {session.results.length > 0 && (
        <ol className="flex flex-col gap-3">
          {session.results.map((r, i) => (
            <li key={i} className="glass animate-rise rounded-2xl p-4" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{r.sentence.text}</p>
                <p className={`shrink-0 font-display font-bold tabular-nums ${TIER_STYLE[r.tier].text}`}>+{r.points}</p>
              </div>
              <div className="relative mt-3 h-2 rounded-full bg-slate-900/10 dark:bg-white/10" aria-hidden="true">
                <span className="bg-mood absolute inset-0 rounded-full opacity-30" />
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-slate-700 dark:ring-white" style={{ left: `${percentOf(r.guess)}%` }} />
                <span className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${TIER_STYLE[r.tier].bg}`} style={{ left: `${percentOf(r.sentence.score)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {TIER_INFO[r.tier].label}｜你 {formatScore(r.guess)}｜參考 {formatScore(r.sentence.score)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
