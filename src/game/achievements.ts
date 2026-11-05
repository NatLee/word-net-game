import { MILESTONE_EVERY, MODES } from '../config.ts';
import type { Annotation, DailyRecord, Sentence } from '../types.ts';
import { localDateKey } from './random.ts';
import { distance, keepsCombo, moodOf, tierFor } from './scoring.ts';
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
  progress?: (ctx: AchievementContext) => { current: number; target: number };
}

const tierOf = (a: Annotation) => tierFor(distance(a.guess, a.reference));

/**
 * Sentence kinds worth an achievement of their own: read this many sentences tagged `tag` well
 * (close or better). The tags are the ones the packs use, so a new kind is one more line here.
 */
const TAG_GOALS = [
  { id: 'sarcasm-radar', title: '反諷雷達', tag: '反諷', times: 10 },
  { id: 'laugh-it-off', title: '苦中作樂', tag: '自嘲', times: 10 },
  { id: 'punchline-detector', title: '笑點偵測器', tag: '幽默', times: 10 },
] as const;
const isPerfect = (a: Annotation) => tierOf(a) === 'perfect';

/** Distinct sentences prevent replaying one easy prompt to complete a collection challenge. */
function distinctCount(ctx: AchievementContext, matches: (answer: Annotation) => boolean): number {
  return new Set(ctx.answers.filter((a) => !a.guest && matches(a)).map((a) => a.sentenceId)).size;
}

function challenge(id: string, title: string, description: string, target: number | ((ctx: AchievementContext) => number), count: (ctx: AchievementContext) => number): Achievement {
  const progress = (ctx: AchievementContext) => {
    const goal = typeof target === 'number' ? target : Math.max(1, target(ctx));
    return { current: Math.min(goal, count(ctx)), target: goal };
  };
  return { id, title, description, progress, check: (ctx) => { const p = progress(ctx); return p.current >= p.target; } };
}

function recoveries(ctx: AchievementContext, from: (answer: Annotation) => boolean, to: (answer: Annotation) => boolean): number {
  const own = ctx.answers.filter((a) => !a.guest);
  return own.filter((answer, i) => i > 0 && from(own[i - 1]) && to(answer)).length;
}

const CHALLENGES: readonly Achievement[] = [
  challenge('office-interpreter', '辦公室翻譯官', '在 20 句不同的「職場」題目拿到「很接近」以上。', 20,
    (c) => distinctCount(c, (a) => c.sentences.get(a.sentenceId)?.pack === 'work' && keepsCombo(tierOf(a)))),
  challenge('subtext-specialist', '弦外之音鑑定師', '在 20 句不同的「話中有話」題目拿到「很接近」以上。', 20,
    (c) => distinctCount(c, (a) => c.sentences.get(a.sentenceId)?.pack === 'twists' && keepsCombo(tierOf(a)))),
  challenge('neutral-reader', '白開水品鑑師', '在 12 句不同的中立情緒題目拿到「完美」。', 12,
    (c) => distinctCount(c, (a) => moodOf(a.reference) === 'neutral' && isPerfect(a))),
  challenge('exact-reader', '一字不差的默契', '在 10 句不同的題目猜中完全相同的參考分數。', 10,
    (c) => distinctCount(c, (a) => distance(a.guess, a.reference) === 0)),
  challenge('sentence-collector', '人間觀察筆記', '累計作答 120 句不同的題目。', 120, (c) => distinctCount(c, () => true)),
  challenge('sun-and-rain', '晴雨都接得住', '分別在 10 句不同的樂觀題、10 句不同的悲觀題拿到「完美」。', 20,
    (c) => (['positive', 'negative'] as const).reduce((sum, mood) => sum + Math.min(10, distinctCount(c, (a) => moodOf(a.reference) === mood && isPerfect(a))), 0)),
  challenge('comeback-reader', '反向導航已校正', '猜反而「失手」後，下一次作答立刻拿到「完美」。', 1,
    (c) => recoveries(c, (a) => tierOf(a) === 'miss' && moodOf(a.reference) !== 'neutral' && moodOf(a.guess) !== 'neutral' && moodOf(a.reference) !== moodOf(a.guess), isPerfect)),
  challenge('edge-recovery', '擦邊救援隊', '完成 5 次「差一點」後，下一次作答回到「很接近」以上。', 5,
    (c) => recoveries(c, (a) => tierOf(a) === 'near', (a) => keepsCombo(tierOf(a)))),
  challenge('polite-decoder', '客套話拆封員', '在 15 句不同、標著「話中有話」或「客套」的題目拿到「完美」。', 15,
    (c) => distinctCount(c, (a) => isPerfect(a) && (c.sentences.get(a.sentenceId)?.tags.some((tag) => tag === '話中有話' || tag === '客套') ?? false))),
  challenge('all-round-reader', '八面玲瓏', '每個題庫各在 5 句不同的題目拿到「很接近」以上。', (c) => c.packIds.length * 5,
    (c) => c.packIds.reduce((sum, pack) => sum + Math.min(5, distinctCount(c, (a) => c.sentences.get(a.sentenceId)?.pack === pack && keepsCombo(tierOf(a)))), 0)),
];

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
    ...TAG_GOALS.map(
      (goal): Achievement => ({
        id: goal.id,
        title: goal.title,
        description: `在標著「${goal.tag}」的句子拿到 ${goal.times} 次「很接近」以上。`,
        check: (c) => c.answers.filter((a) => c.sentences.get(a.sentenceId)?.tags.includes(goal.tag) && keepsCombo(tierOf(a))).length >= goal.times,
      }),
    ),
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
    ...CHALLENGES,
  ];
}

export const ACHIEVEMENTS: readonly Achievement[] = defineAchievements();

/** Ids of every achievement the context satisfies (unlocked or not). */
export function satisfied(ctx: AchievementContext): string[] {
  const own = { ...ctx, answers: ctx.answers.filter((a) => !a.guest) };
  return ACHIEVEMENTS.filter((a) => a.check(own)).map((a) => a.id);
}
