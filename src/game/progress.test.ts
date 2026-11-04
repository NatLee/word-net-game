// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MILESTONE_EVERY, MODES, RANKS } from '../config.ts';
import type { Annotation, Sentence } from '../types.ts';
import { ACHIEVEMENTS, longestDayStreak, satisfied, type AchievementContext } from './achievements.ts';
import { rankFor, rankUp, xpOf } from './progress.ts';
import { createSession, reduce, type Action, type Session } from './session.ts';

const answer = (over: Partial<Annotation> = {}): Annotation => ({
  sentenceId: 's-0',
  text: 't',
  guess: 0.5,
  reference: 0.5,
  mode: 'classic',
  name: '小明',
  points: 100,
  at: 'now',
  ...over,
});

describe('ranks', () => {
  it('starts at level 1 with no XP and climbs at each threshold', () => {
    expect(rankFor(0)).toMatchObject({ level: 1, title: RANKS[0].title, nextXp: RANKS[1].minXp, progress: 0 });
    expect(rankFor(RANKS[1].minXp - 1).level).toBe(1);
    expect(rankFor(RANKS[1].minXp)).toMatchObject({ level: 2, title: RANKS[1].title, progress: 0 });
  });

  it('tops out at the last rank', () => {
    const top = RANKS[RANKS.length - 1];
    expect(rankFor(top.minXp * 10)).toMatchObject({ level: RANKS.length, nextXp: null, progress: 1 });
  });

  it('reports a rank up only when the level changes', () => {
    expect(rankUp(RANKS[1].minXp - 10, RANKS[1].minXp + 10)?.level).toBe(2);
    expect(rankUp(RANKS[1].minXp, RANKS[1].minXp + 10)).toBeNull();
  });

  it('counts every point ever scored as XP', () => {
    expect(xpOf([answer({ points: 40 }), answer({ points: 125 })])).toBe(165);
  });
});

describe('achievements', () => {
  const sentence = (id: string, pack: string, tags: string[] = []): Sentence => ({ id, text: id, score: 0, tags, pack });
  const sentences = new Map([sentence('s-0', 'a'), sentence('irony', 'b', ['反諷'])].map((s) => [s.id, s]));
  const ctx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
    answers: [],
    sentences,
    packIds: ['a', 'b'],
    finished: false,
    daily: {},
    ...over,
  });
  const has = (id: string, c: AchievementContext) => satisfied(c).includes(id);
  const play = (mode: Session['mode'], guesses: number[], score = 0) => {
    const queue = guesses.map((_, i) => ({ ...sentence(`q-${i}`, 'a'), score }));
    let s = createSession(mode, queue);
    for (const g of guesses) s = [{ type: 'move', value: g } as Action, { type: 'lock' } as Action, { type: 'next' } as Action].reduce(reduce, s);
    return s;
  };

  it('have unique ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('first cast, bullseye and the hundredth answer', () => {
    expect(satisfied(ctx())).toEqual([]);
    expect(has('first-cast', ctx({ answers: [answer({ guess: -1 })] }))).toBe(true);
    expect(has('bullseye', ctx({ answers: [answer({ guess: -1 })] }))).toBe(false);
    expect(has('bullseye', ctx({ answers: [answer({ guess: 0.45 })] }))).toBe(true);
    expect(has('hundred', ctx({ answers: Array.from({ length: MILESTONE_EVERY }, () => answer()) }))).toBe(true);
  });

  it('combos of 5 and 10 within a run', () => {
    expect(has('hot-hand', ctx({ session: play('classic', [0, 0, 0, 0]) }))).toBe(false);
    expect(has('hot-hand', ctx({ session: play('classic', [0, 0, 0, 0, 0]) }))).toBe(true);
    expect(has('unstoppable', ctx({ session: play('classic', Array(10).fill(0)) }))).toBe(true);
  });

  it('sarcasm radar needs five close guesses on 反諷 sentences', () => {
    const close = answer({ sentenceId: 'irony', reference: -0.5, guess: -0.3 });
    expect(has('sarcasm-radar', ctx({ answers: Array(4).fill(close) }))).toBe(false);
    expect(has('sarcasm-radar', ctx({ answers: Array(5).fill(close) }))).toBe(true);
  });

  it('extremes needs a perfect at both ends; middle a perfect on 0', () => {
    const low = answer({ reference: -0.95, guess: -0.95 });
    const high = answer({ reference: 0.9, guess: 0.85 });
    expect(has('extremes', ctx({ answers: [low] }))).toBe(false);
    expect(has('extremes', ctx({ answers: [low, high] }))).toBe(true);
    expect(has('middle', ctx({ answers: [answer({ reference: 0, guess: 0.05 })] }))).toBe(true);
  });

  it('flawless needs a finished classic run with no near or miss', () => {
    const perfectRun = play('classic', Array(MODES.classic.rounds).fill(0));
    expect(has('flawless', ctx({ session: perfectRun, finished: false }))).toBe(false);
    expect(has('flawless', ctx({ session: perfectRun, finished: true }))).toBe(true);
    const oneSlip = play('classic', [...Array(MODES.classic.rounds - 1).fill(0), 0.4]);
    expect(has('flawless', ctx({ session: oneSlip, finished: true }))).toBe(false);
  });

  it('long timed and survival runs', () => {
    expect(has('lightning', ctx({ session: play('rush', Array(20).fill(0)) }))).toBe(true);
    expect(has('lightning', ctx({ session: play('rush', Array(19).fill(0)) }))).toBe(false);
    expect(has('survivor', ctx({ session: play('survival', Array(25).fill(0)) }))).toBe(true);
  });

  it('daily streaks count consecutive calendar days, across months', () => {
    expect(longestDayStreak(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-03'])).toBe(3);
    expect(longestDayStreak(['2026-11-01', '2026-11-03'])).toBe(1);
    expect(longestDayStreak([])).toBe(0);
    const day = { score: 1, tiers: [], bestStreak: 0, averageDistance: 0 };
    const daily = Object.fromEntries(['2026-11-02', '2026-11-03', '2026-11-04'].map((date) => [date, { date, ...day }]));
    expect(has('regular', ctx({ daily }))).toBe(true);
  });

  it('explorer needs an answer from every pack', () => {
    expect(has('explorer', ctx({ answers: [answer()] }))).toBe(false);
    expect(has('explorer', ctx({ answers: [answer(), answer({ sentenceId: 'irony' })] }))).toBe(true);
  });
});
