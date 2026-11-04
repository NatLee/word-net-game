import { MILESTONE_EVERY, MODES } from '../config.ts';
import type { Annotation, DailyRecord, Sentence } from '../types.ts';
import { localDateKey } from './random.ts';
import { distance, keepsCombo, tierFor } from './scoring.ts';
import type { Session } from './session.ts';

/** What an achievement can look at. Checked after every answer and once more when a run ends. */
export interface AchievementContext {
  /** The player's own answers, oldest first, including the one just given. */
  answers: readonly Annotation[];
  /** Every sentence the game knows, by id (for tags and packs). */
  sentences: ReadonlyMap<string, Sentence>;
  /** Ids of every pack. */
  packIds: readonly string[];
  /** The run in progress, or the one that just ended. */
  session?: Session;
  /** True on the check made when the run ends. */
  finished: boolean;
  /** True on the check made when a duo match ends. */
  duo?: boolean;
  daily: Readonly<Record<string, DailyRecord>>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  check: (ctx: AchievementContext) => boolean;
}

const tierOf = (a: Annotation) => tierFor(distance(a.guess, a.reference));
const isPerfect = (a: Annotation) => tierOf(a) === 'perfect';

/** The longest run of consecutive days in a set of YYYY-MM-DD keys. */
export function longestDayStreak(days: readonly string[]): number {
  const set = new Set(days);
  let best = 0;
  for (const day of set) {
    const [y, m, d] = day.split('-').map(Number);
    const previous = localDateKey(new Date(y, m - 1, d - 1));
    if (set.has(previous)) continue; // not the start of a streak
    let length = 1;
    while (set.has(localDateKey(new Date(y, m - 1, d + length)))) length++;
    best = Math.max(best, length);
  }
  return best;
}

/**
 * Every achievement, as data: the numbers each one needs sit next to its text, so the
 * description can never disagree with the check.
 */
function defineAchievements(): Achievement[] {
  const hot = 5;
  const unstoppable = 10;
  const sarcasm = { tag: '反諷', times: 5 };
  const extreme = 0.9;
  const lightning = 20;
  const survivor = 25;
  const regular = 3;
  return [
    { id: 'first-cast', title: '第一網', description: '撒出第一張網。', check: (c) => c.answers.length >= 1 },
    { id: 'bullseye', title: '正中紅心', description: '第一次拿到「完美」。', check: (c) => c.answers.some(isPerfect) },
    {
      id: 'hot-hand',
      title: '手感發燙',
      description: `一局裡連擊到 ${hot}。`,
      check: (c) => (c.session?.bestStreak ?? 0) >= hot,
    },
    {
      id: 'unstoppable',
      title: '停不下來',
      description: `一局裡連擊到 ${unstoppable}。`,
      check: (c) => (c.session?.bestStreak ?? 0) >= unstoppable,
    },
    {
      id: 'hundred',
      title: '百句達人',
      description: `累計判斷 ${MILESTONE_EVERY} 句。`,
      check: (c) => c.answers.length >= MILESTONE_EVERY,
    },
    {
      id: 'sarcasm-radar',
      title: '反諷雷達',
      description: `在標著「${sarcasm.tag}」的句子拿到 ${sarcasm.times} 次「很接近」以上。`,
      check: (c) => c.answers.filter((a) => c.sentences.get(a.sentenceId)?.tags.includes(sarcasm.tag) && keepsCombo(tierOf(a))).length >= sarcasm.times,
    },
    {
      id: 'extremes',
      title: '兩極',
      description: `參考分數 -${extreme} 以下和 +${extreme} 以上的句子，都拿過「完美」。`,
      check: (c) => c.answers.some((a) => a.reference <= -extreme && isPerfect(a)) && c.answers.some((a) => a.reference >= extreme && isPerfect(a)),
    },
    {
      id: 'middle',
      title: '不偏不倚',
      description: '在參考分數 0 的句子拿到「完美」。',
      check: (c) => c.answers.some((a) => a.reference === 0 && isPerfect(a)),
    },
    {
      id: 'flawless',
      title: '零失誤',
      description: `經典模式一局 ${MODES.classic.rounds} 句，全部「很接近」以上。`,
      check: (c) =>
        c.finished &&
        c.session?.mode === 'classic' &&
        c.session.results.length === MODES.classic.rounds &&
        c.session.results.every((r) => keepsCombo(r.tier)),
    },
    {
      id: 'lightning',
      title: '閃電手',
      description: `限時模式一局答 ${lightning} 句以上。`,
      check: (c) => c.session?.mode === 'rush' && c.session.results.length >= lightning,
    },
    {
      id: 'survivor',
      title: '九命',
      description: `生存模式一局撐過 ${survivor} 句。`,
      check: (c) => c.session?.mode === 'survival' && c.session.results.length >= survivor,
    },
    {
      id: 'regular',
      title: '每日報到',
      description: `連續 ${regular} 天完成每日挑戰。`,
      check: (c) => longestDayStreak(Object.keys(c.daily)) >= regular,
    },
    {
      id: 'explorer',
      title: '題庫巡禮',
      description: '每個題庫都至少答過一句。',
      check: (c) => {
        const seen = new Set(c.answers.map((a) => c.sentences.get(a.sentenceId)?.pack));
        return c.packIds.every((id) => seen.has(id));
      },
    },
    { id: 'duel', title: '雙人對決', description: '和朋友在同一台裝置上打完一場雙人對戰。', check: (c) => c.duo === true },
  ];
}

export const ACHIEVEMENTS: readonly Achievement[] = defineAchievements();

/** Ids of every achievement the context satisfies (unlocked or not). */
export function satisfied(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}
