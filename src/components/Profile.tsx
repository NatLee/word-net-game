import { Award, Lock } from 'lucide-react';
import { ACHIEVEMENTS, type AchievementContext } from '../game/achievements.ts';
import { rankFor } from '../game/progress.ts';
import { Modal } from './Modal.tsx';

const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });

interface ProfileProps {
  name: string;
  xp: number;
  answers: number;
  perfects: number;
  bestStreak: number;
  /** Achievement id → ISO time it was unlocked. */
  unlocked: Readonly<Record<string, string>>;
  context: AchievementContext;
  onClose: () => void;
}

/** The bar from the current rank to the next one. */
export function RankBar({ xp, className = '' }: { xp: number; className?: string }) {
  const rank = rankFor(xp);
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-bold">
          Lv.{rank.level} <span className="text-mood">{rank.title}</span>
        </span>
        <span className="font-display text-slate-500 tabular-nums dark:text-slate-400">
          {rank.nextXp === null ? `${xp} XP` : `${xp} / ${rank.nextXp} XP`}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10"
        role="progressbar"
        aria-label={rank.nextXp === null ? '已經是最高段位' : `距離下一個段位 ${rank.nextXp - xp} XP`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(rank.progress * 100)}
      >
        <div className="bg-mood h-full rounded-full transition-[width] duration-700" style={{ width: `${rank.progress * 100}%` }} />
      </div>
    </div>
  );
}

export function Profile({ name, xp, answers, perfects, bestStreak, unlocked, context, onClose }: ProfileProps) {
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const stats = [
    { label: '判斷句數', value: answers },
    { label: '完美次數', value: perfects },
    { label: '最佳連擊', value: bestStreak },
    { label: '經驗值', value: xp },
  ];
  return (
    <Modal title={`${name} 的檔案`} onClose={onClose} className="sm:max-w-2xl">
      <div className="flex flex-col gap-6">
        <RankBar xp={xp} />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-900/5 px-3 py-3 text-center dark:bg-white/5">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{s.label}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <section aria-labelledby="achievements-title">
          <h3 id="achievements-title" className="mb-3 font-semibold">
            成就 <span className="font-display text-slate-500 tabular-nums dark:text-slate-400">{count} / {ACHIEVEMENTS.length}</span>
          </h3>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">收集不同句子、讀懂中立、猜反後扳回來。重複作答同一句不會增加收集進度；雙人訪客的答案也不會計入。</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const at = unlocked[a.id];
              const progress = a.progress?.(context);
              return (
                <li key={a.id} className={`flex items-start gap-3 rounded-2xl p-3 ${at ? 'bg-slate-900/[0.04] dark:bg-white/[0.06]' : 'opacity-60'}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${at ? 'bg-mood text-white' : 'bg-slate-900/10 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                    {at ? <Award className="size-5" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">
                      {a.title}
                      <span className="sr-only">{at ? '（已解鎖）' : '（還沒解鎖）'}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{a.description}</p>
                    {progress && (
                      <div className="mt-2">
                        <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{at ? progress.target : progress.current} / {progress.target}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10" role="progressbar" aria-label={`${a.title}進度`} aria-valuemin={0} aria-valuemax={progress.target} aria-valuenow={at ? progress.target : progress.current}>
                          <div className="bg-mood h-full rounded-full" style={{ width: `${((at ? progress.target : progress.current) / progress.target) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {at && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{dateFormat.format(new Date(at))} 解鎖</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
