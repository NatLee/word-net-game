// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SHARE_SYMBOLS_PER_LINE } from '../config.ts';
import { hashString, localDateKey, seededRandom, shuffle } from './random.ts';
import { shareText } from './share.ts';

describe('shareText', () => {
  it('shows the mode, date, score and one symbol per sentence, without the answers', () => {
    const text = shareText({
      mode: 'daily',
      date: '2026-11-04',
      score: 412,
      tiers: ['perfect', 'perfect', 'close', 'near', 'miss'],
      bestStreak: 3,
      averageDistance: 0.184,
      url: 'https://example.com/word-net-game/',
    });
    expect(text).toBe(
      ['Word Net 每日挑戰 2026-11-04', '412 分（5 句）', '◎◎○△×', '最高連擊 3｜平均差距 0.18', 'https://example.com/word-net-game/'].join('\n'),
    );
  });

  it('wraps long timed runs onto several lines', () => {
    const tiers = Array.from({ length: SHARE_SYMBOLS_PER_LINE + 3 }, () => 'close' as const);
    const lines = shareText({ mode: 'rush', score: 1, tiers, bestStreak: 1, averageDistance: 0, url: 'u' }).split('\n');
    expect(lines[0]).toBe('Word Net 限時');
    expect(lines[2]).toHaveLength(SHARE_SYMBOLS_PER_LINE);
    expect(lines[3]).toHaveLength(3);
  });
});

describe('random helpers', () => {
  it('repeat the same sequence for the same seed', () => {
    const a = seededRandom(hashString('2026-11-04'));
    const b = seededRandom(hashString('2026-11-04'));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('shuffle keeps every item exactly once', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffle(items, seededRandom(7));
    expect(shuffled).not.toEqual(items);
    expect([...shuffled].sort((x, y) => x - y)).toEqual(items);
  });

  it('localDateKey uses the local calendar date', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
