// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Annotation, Sentence } from '../types.ts';
import { testFeedback } from '../test/fixtures.ts';
import { ACHIEVEMENTS, satisfied, type AchievementContext } from './achievements.ts';

const answer = (id: string, reference = 0.5, guess = reference): Annotation => ({ sentenceId: id, text: id, reference, guess, mode: 'classic', name: '玩家', points: 100, at: '2026-11-06T00:00:00Z' });
function context(answers: Annotation[], pack = 'work', tags: string[] = [], packIds = [pack]): AchievementContext {
  const sentences = new Map<string, Sentence>(answers.map((a) => [a.sentenceId, { id: a.sentenceId, text: a.text, score: a.reference, tags, pack, feedback: testFeedback }]));
  return { answers, sentences, packIds, daily: {}, finished: false };
}
const goal = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;
const has = (id: string, ctx: AchievementContext) => satisfied(ctx).includes(id);
const unique = (n: number, score = 0.5, guess = score) => Array.from({ length: n }, (_, i) => answer(`s-${i}`, score, guess));

describe('reading challenges', () => {
  it.each([['office-interpreter', 'work'], ['subtext-specialist', 'twists']])('%s counts twenty distinct close readings in its own pack', (id, pack) => {
    expect(has(id, context(unique(19), pack))).toBe(false);
    expect(has(id, context(unique(20, 0.5, 0.3), pack))).toBe(true);
    expect(has(id, context(unique(20), 'other'))).toBe(false);
    expect(has(id, context(Array(20).fill(answer('same')), pack))).toBe(false);
    expect(has(id, context(unique(20).map((a) => ({ ...a, guest: true })), pack))).toBe(false);
  });

  it('needs twelve distinct neutral perfects and respects the mood boundary', () => {
    expect(has('neutral-reader', context(unique(11, 0)))).toBe(false);
    expect(has('neutral-reader', context(unique(12, 0.2)))).toBe(true);
    expect(has('neutral-reader', context(unique(12, -0.2)))).toBe(false);
    expect(has('neutral-reader', context(unique(12, 0, 0.15)))).toBe(false);
  });

  it('distinguishes an exact match from the perfect tolerance', () => {
    expect(has('exact-reader', context(unique(9)))).toBe(false);
    expect(has('exact-reader', context(unique(10)))).toBe(true);
    expect(has('exact-reader', context(unique(10, 0.5, 0.55)))).toBe(false);
    expect(has('exact-reader', context(Array(10).fill(answer('same'))))).toBe(false);
  });

  it('collects distinct sentences and excludes guests from progress', () => {
    const c = context([...unique(119), { ...answer('guest'), guest: true }]);
    expect(goal('sentence-collector').progress?.(c)).toEqual({ current: 119, target: 120 });
    expect(has('sentence-collector', c)).toBe(false);
    expect(has('sentence-collector', context(unique(120)))).toBe(true);
  });

  it('requires ten happy and ten sad perfects without letting one side fill both quotas', () => {
    const happy = unique(20, 0.8);
    const sad = unique(10, -0.8).map((a) => ({ ...a, sentenceId: `sad-${a.sentenceId}` }));
    expect(goal('sun-and-rain').progress?.(context(happy))).toEqual({ current: 10, target: 20 });
    expect(has('sun-and-rain', context([...happy, ...sad.slice(0, 9)]))).toBe(false);
    expect(has('sun-and-rain', context([...happy, ...sad]))).toBe(true);
  });

  it('awards a comeback only when an opposite miss is immediately followed by a perfect own answer', () => {
    const miss = answer('miss', -0.8, 0.8);
    const hit = answer('hit');
    expect(has('comeback-reader', context([miss, hit]))).toBe(true);
    expect(has('comeback-reader', context([miss, { ...answer('guest', -0.5, 0.5), guest: true }, hit]))).toBe(true);
    expect(has('comeback-reader', context([miss, answer('near', 0.5, 0.2), hit]))).toBe(false);
    expect(has('comeback-reader', context([answer('neutral-miss', 0, 1), hit]))).toBe(false);
    expect(has('comeback-reader', context([answer('opposite-near', 0.21, -0.2), hit]))).toBe(false);
  });

  it('counts five near-to-close recoveries, including their exact tier boundaries', () => {
    const pair = [answer('edge', 0, 0.5), answer('fixed', 0, 0.25)];
    expect(has('edge-recovery', context(Array.from({ length: 4 }, () => pair).flat()))).toBe(false);
    expect(has('edge-recovery', context(Array.from({ length: 5 }, () => pair).flat()))).toBe(true);
    expect(has('edge-recovery', context(Array.from({ length: 5 }, () => [answer('close', 0, 0.25), answer('hit', 0)]).flat()))).toBe(false);
  });

  it('recognises both subtext and polite tags, but needs fifteen distinct perfects', () => {
    for (const tag of ['話中有話', '客套']) {
      expect(has('polite-decoder', context(unique(14), 'twists', [tag]))).toBe(false);
      expect(has('polite-decoder', context(unique(15), 'twists', [tag]))).toBe(true);
    }
    expect(has('polite-decoder', context(unique(15), 'twists', ['轉折']))).toBe(false);
  });

  it('requires five distinct good readings per pack, with useful capped progress', () => {
    const first = context(unique(12), 'work', [], ['work', 'twists']);
    expect(goal('all-round-reader').progress?.(first)).toEqual({ current: 5, target: 10 });
    const more = unique(5).map((a) => ({ ...a, sentenceId: `twist-${a.sentenceId}` }));
    const second = context(more, 'twists');
    const combined = { ...first, answers: [...first.answers, ...more], sentences: new Map([...first.sentences, ...second.sentences]) };
    expect(has('all-round-reader', { ...combined, answers: combined.answers.slice(0, -1) })).toBe(false);
    expect(has('all-round-reader', combined)).toBe(true);
    expect(goal('all-round-reader').progress?.(combined)).toEqual({ current: 10, target: 10 });
  });
});
