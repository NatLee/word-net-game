import { CalendarDays, ChevronRight, Heart, Sparkles, Timer, Trophy } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { MILESTONE_EVERY, MODES } from '../config.ts';
import { MODE_INFO, MODE_ORDER } from '../game/labels.ts';
import { rankRuns } from '../lib/records.ts';
import type { DailyRecord, ModeId, RunRecord, SentencePack } from '../types.ts';
import { PackPicker } from './PackPicker.tsx';
import { RankBar } from './Profile.tsx';
import { ShareButtons } from './Share.tsx';

const MODE_ICON: Record<ModeId, ComponentType<SVGProps<SVGSVGElement>>> = {
  classic: Sparkles,
  rush: Timer,
  survival: Heart,
  daily: CalendarDays,
};

interface HomeProps {
  name: string;
  total: number;
  xp: number;
  runs: readonly RunRecord[];
  /** Today's daily result, if the player already played it. */
  dailyDone?: DailyRecord;
  dailyShareText?: string;
  packs: readonly SentencePack[];
  /** The chosen pack, or null for all. */
  packId: string | null;
  onPack: (packId: string | null) => void;
  onStart: (mode: ModeId) => void;
}

export function Home({ name, total, xp, runs, dailyDone, dailyShareText, packs, packId, onPack, onStart }: HomeProps) {
  const intoMilestone = total % MILESTONE_EVERY;
  const nextMilestone = total - intoMilestone + MILESTONE_EVERY;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <div className="animate-rise pt-2 text-center sm:pt-6">
        <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-slate-500 dark:text-slate-400">讀一句話 · 撒一張網</p>
        <h1 className="font-display text-4xl leading-tight font-black tracking-tight text-balance sm:text-6xl">
          這句話，<span className="text-mood">有多開心？</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-slate-600 sm:text-lg dark:text-slate-300">
          把網子撒在你覺得的情緒上，越左越難過、越右越開心。揭曉參考分數後，越接近分數越高，連續猜準還有連擊加成。
        </p>
      </div>

      <div className="glass mx-auto flex w-full max-w-xl animate-rise flex-col gap-3 rounded-3xl p-5 [animation-delay:80ms]">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-lg font-bold">
            嗨，<span className="text-mood">{name || '玩家'}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            已經判斷 <span className="font-display text-xl font-bold tabular-nums text-slate-900 dark:text-white">{total}</span> 句
          </p>
        </div>
        <RankBar xp={xp} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          再 {nextMilestone - total} 句就到 {nextMilestone} 句，每滿 {MILESTONE_EVERY} 句有小驚喜。
        </p>
      </div>

      <PackPicker packs={packs} value={packId} onChange={onPack} />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODE_ORDER.map((mode, i) => {
          const Icon = MODE_ICON[mode];
          const best = rankRuns(runs, mode)[0];
          const done = MODES[mode].seededByDate ? dailyDone : undefined;
          return (
            <li key={mode} className="glass flex animate-rise flex-col rounded-3xl p-5" style={{ animationDelay: `${140 + i * 70}ms` }}>
              <div className="mb-3 flex items-center gap-3">
                <span className="bg-mood grid size-11 place-items-center rounded-2xl text-white shadow-md shadow-fuchsia-500/25">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{MODE_INFO[mode].title}</h2>
              </div>
              <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">{MODE_INFO[mode].blurb}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Trophy className="size-3.5" aria-hidden="true" />
                {best ? `最佳 ${best.score} 分` : '還沒有紀錄'}
              </p>
              {done ? (
                <div className="mt-4 flex flex-col gap-3">
                  <p className="rounded-2xl bg-slate-900/5 px-4 py-3 text-center text-sm dark:bg-white/5">
                    今天完成了：<span className="font-display text-lg font-bold">{done.score}</span> 分，明天再來！
                  </p>
                  {dailyShareText && <ShareButtons text={dailyShareText} />}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onStart(mode)}
                  className="group bg-mood mt-4 flex min-h-12 items-center justify-center gap-1 rounded-2xl px-5 font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110"
                >
                  開始{MODE_INFO[mode].title}
                  <ChevronRight className="size-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
