// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DUO } from '../config.ts';
import type { Sentence } from '../types.ts';
import { createDuo, matchWinner, reduceDuo, type DuoAction, type DuoSession } from './duo.ts';
import { duoShareText } from './share.ts';

const queue: Sentence[] = Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, text: `句子 ${i}`, score: 0.5, tags: [], pack: 'p' }));
const run = (s: DuoSession, ...actions: DuoAction[]) => actions.reduce(reduceDuo, s);
/** One round: A puts the net at `a`, B at `b`. */
const round = (a: number, b: number): DuoAction[] => [{ type: 'move', value: a }, { type: 'lock' }, { type: 'move', value: b }, { type: 'lock' }];

describe('a duo match', () => {
  it('plays DUO.rounds sentences', () => {
    expect(createDuo(['A', 'B'], queue).queue).toHaveLength(DUO.rounds);
  });

  it('hides the first net and starts the second player in the middle', () => {
    const s = run(createDuo(['A', 'B'], queue), { type: 'move', value: 0.9 }, { type: 'lock' });
    expect(s).toMatchObject({ phase: 'guessing', turn: 1, guess: 0 });
    expect(s.players[0].guess).toBe(0.9);
    expect(s.players[0].results).toHaveLength(0); // not scored until both have cast
  });

  it('reveals both guesses together and gives the round to the closer one', () => {
    const s = run(createDuo(['A', 'B'], queue), ...round(0.5, -0.5));
    expect(s.phase).toBe('revealed');
    expect(s.players.map((p) => p.results[0].tier)).toEqual(['perfect', 'miss']);
    expect(s.players.map((p) => p.wins)).toEqual([1, 0]);
  });

  it('counts a tie as a round nobody won, and resets the nets for the next one', () => {
    let s = run(createDuo(['A', 'B'], queue), ...round(0.4, 0.6));
    expect(s.players.map((p) => p.wins)).toEqual([0, 0]);
    s = reduceDuo(s, { type: 'next' });
    expect(s).toMatchObject({ round: 1, turn: 0, guess: 0, phase: 'guessing' });
    expect(s.players.map((p) => p.guess)).toEqual([null, null]);
  });

  it('ends after the last round with a winner, or a draw', () => {
    let s = createDuo(['A', 'B'], queue);
    for (let i = 0; i < DUO.rounds; i++) s = run(s, ...round(0.5, i === 0 ? 0.5 : 0), { type: 'next' });
    expect(s.phase).toBe('finished');
    expect(matchWinner(s)).toBe(0);
    let draw = createDuo(['A', 'B'], queue);
    for (let i = 0; i < DUO.rounds; i++) draw = run(draw, ...round(0.5, 0.5), { type: 'next' });
    expect(matchWinner(draw)).toBeNull();
  });

  it('shares as a score line', () => {
    expect(duoShareText(['小明', '阿華'], [520, 410], 0, 'u')).toBe('Word Net 雙人對戰\n小明 520 : 410 阿華\n小明 贏了！\nu');
    expect(duoShareText(['小明', '阿華'], [300, 300], null, 'u')).toContain('平手！');
  });
});
