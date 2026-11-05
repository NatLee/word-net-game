// @vitest-environment node
import { testFeedback } from '../test/fixtures.ts';
import { describe, expect, it } from 'vitest';
import { LIVES, MODES } from '../config.ts';
import type { Sentence } from '../types.ts';
import { seededRandom } from './random.ts';
import { createSession, currentSentence, dealSentences, isLastRound, reduce, summarize, totalRounds, type Action, type Session } from './session.ts';

const pool: Sentence[] = Array.from({ length: 30 }, (_, i) => ({
  id: `s-${i}`,
  text: `句子 ${i}`,
  score: (i % 5) / 2 - 1, // -1, -0.5, 0, 0.5, 1
  tags: [],
  pack: 'test', feedback: testFeedback,
}));

const run = (session: Session, ...actions: Action[]) => actions.reduce(reduce, session);

describe('dealSentences', () => {
  it('deals the configured number of different sentences for round-based modes', () => {
    const classic = dealSentences('classic', pool, '2026-11-04', seededRandom(1));
    expect(classic).toHaveLength(MODES.classic.rounds);
    expect(new Set(classic.map((s) => s.id)).size).toBe(classic.length);
  });

  it('deals the whole pool for the timed mode', () => {
    expect(dealSentences('rush', pool, '2026-11-04', seededRandom(1))).toHaveLength(pool.length);
  });

  it('gives everyone the same daily sentences on the same date, whatever `random` is', () => {
    const a = dealSentences('daily', pool, '2026-11-04', seededRandom(1));
    const b = dealSentences('daily', pool, '2026-11-04', seededRandom(999));
    const tomorrow = dealSentences('daily', pool, '2026-11-05', seededRandom(1));
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
    expect(a.map((s) => s.id)).not.toEqual(tomorrow.map((s) => s.id));
    expect(a).toHaveLength(MODES.daily.rounds);
  });
});

describe('a classic run', () => {
  const queue = pool.slice(0, 3); // scores -1, -0.5, 0

  it('moves the net, locks, reveals and moves on', () => {
    let s = createSession('classic', queue);
    expect(s).toMatchObject({ phase: 'guessing', round: 0, guess: 0, timeLeftMs: null });

    s = run(s, { type: 'move', value: -0.95 }, { type: 'lock' });
    expect(s.phase).toBe('revealed');
    expect(s.results[0]).toMatchObject({ guess: -0.95, distance: 0.05, tier: 'perfect', points: 100, streak: 1 });
    expect(s.score).toBe(100);

    // Moving after the lock changes nothing.
    expect(reduce(s, { type: 'move', value: 1 }).guess).toBe(-0.95);

    s = reduce(s, { type: 'next' });
    expect(s).toMatchObject({ phase: 'guessing', round: 1, guess: 0 });
    expect(currentSentence(s).id).toBe('s-1');
  });

  it('keeps the net on the scale when nudged past an end', () => {
    const s = run(createSession('classic', queue), { type: 'nudge', by: -0.75 }, { type: 'nudge', by: -0.75 });
    expect(s.guess).toBe(-1);
  });

  it('counts the combo across rounds and finishes after the last sentence', () => {
    const s = run(
      createSession('classic', queue),
      { type: 'move', value: -1 }, { type: 'lock' }, { type: 'next' }, // perfect, streak 1, 100
      { type: 'move', value: -0.3 }, { type: 'lock' }, { type: 'next' }, // close 0.2, streak 2, 80 × 1.25 = 100
      { type: 'move', value: 0.6 }, { type: 'lock' }, { type: 'next' }, // miss 0.6, streak 0, 40
    );
    expect(s.phase).toBe('finished');
    expect(s.results.map((r) => r.points)).toEqual([100, 100, 40]);
    expect(summarize(s)).toEqual({ score: 240, rounds: 3, averageDistance: 0.27, bestStreak: 2, perfects: 1 });
  });

  it('ignores the clock', () => {
    const s = reduce(createSession('classic', queue), { type: 'tick', ms: 999_999 });
    expect(s.phase).toBe('guessing');
  });
});

describe('a timed run', () => {
  it('starts with the configured time and wraps around the queue', () => {
    const s = createSession('rush', pool.slice(0, 2));
    expect(s.timeLeftMs).toBe(MODES.rush.seconds * 1000);
    expect(totalRounds(s)).toBeNull();
    const third = run(s, { type: 'lock' }, { type: 'next' }, { type: 'lock' }, { type: 'next' });
    expect(third.round).toBe(2);
    expect(currentSentence(third).id).toBe('s-0');
  });

  it('only counts down while guessing, and ends when time is up', () => {
    let s = createSession('rush', pool);
    s = run(s, { type: 'tick', ms: 10_000 }, { type: 'lock' }, { type: 'tick', ms: 10_000 });
    expect(s.timeLeftMs).toBe(MODES.rush.seconds * 1000 - 10_000); // the reveal is free
    s = run(s, { type: 'next' }, { type: 'tick', ms: 999_999 });
    expect(s).toMatchObject({ phase: 'finished', timeLeftMs: 0 });
    expect(s.results).toHaveLength(1); // the unanswered sentence does not count
  });
});

describe('a survival run', () => {
  const queue = pool.filter((s) => s.score === 0); // every sentence scores 0
  const miss: Action[] = [{ type: 'move', value: 1 }, { type: 'lock' }];
  const perfect: Action[] = [{ type: 'move', value: 0 }, { type: 'lock' }];

  it('starts with the configured lives and has no fixed length', () => {
    const s = createSession('survival', queue);
    expect(s.lives).toBe(MODES.survival.lives);
    expect(totalRounds(s)).toBeNull();
  });

  it('loses a life on a miss, shows the fatal reveal, then ends', () => {
    let s = createSession('survival', queue);
    for (let i = 1; i < MODES.survival.lives; i++) s = run(s, ...miss, { type: 'next' });
    expect(s.lives).toBe(1);
    s = run(s, ...miss);
    expect(s).toMatchObject({ phase: 'revealed', lives: 0 });
    expect(s.results.at(-1)?.lifeChange).toBe(-1);
    expect(isLastRound(s)).toBe(true);
    expect(reduce(s, { type: 'next' }).phase).toBe('finished');
  });

  it('gives a life back on every healEvery-th combo guess, never above the start', () => {
    let s = run(createSession('survival', queue), ...miss, { type: 'next' });
    for (let i = 0; i < LIVES.healEvery; i++) s = run(s, ...perfect, { type: 'next' });
    expect(s.lives).toBe(MODES.survival.lives);
    expect(s.results.at(-1)).toMatchObject({ streak: LIVES.healEvery, lifeChange: 1 });
    for (let i = 0; i < LIVES.healEvery; i++) s = run(s, ...perfect, { type: 'next' });
    expect(s.lives).toBe(MODES.survival.lives); // already full: no change
    expect(s.results.at(-1)?.lifeChange).toBe(0);
  });

  it('keeps lives out of the other modes', () => {
    const s = run(createSession('classic', queue), ...miss);
    expect(s.lives).toBeNull();
    expect(s.results[0].lifeChange).toBe(0);
  });
});

it('refuses an empty queue', () => {
  expect(() => createSession('classic', [])).toThrow();
});
