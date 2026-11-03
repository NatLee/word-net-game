// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SCORING } from '../config.ts';
import { basePoints, comboMultiplier, distance, formatScore, moodLabel, scoreGuess, snap, tierFor } from './scoring.ts';

describe('snap', () => {
  it('rounds to 0.01 and keeps the value on the -1…+1 scale', () => {
    expect(snap(0.123)).toBe(0.12);
    expect(snap(0.125)).toBe(0.13);
    expect(snap(1.7)).toBe(1);
    expect(snap(-3)).toBe(-1);
  });

  it('never returns -0', () => {
    expect(Object.is(snap(-0.001), 0)).toBe(true);
  });
});

describe('distance', () => {
  it('is the absolute gap, up to 2 for opposite ends (not clamped to the scale)', () => {
    expect(distance(0.3, 0.5)).toBe(0.2);
    expect(distance(-1, 1)).toBe(2);
    expect(distance(-0.75, 0.75)).toBe(1.5);
  });

  it('has no floating-point noise', () => {
    expect(distance(0.7, 0.6)).toBe(0.1);
  });
});

describe('tiers', () => {
  // Thresholds from SCORING.tiers: perfect ≤ 0.1, close ≤ 0.25, near ≤ 0.5.
  it.each([
    [0, 'perfect'],
    [0.1, 'perfect'],
    [0.11, 'close'],
    [0.25, 'close'],
    [0.26, 'near'],
    [0.5, 'near'],
    [0.51, 'miss'],
    [2, 'miss'],
  ] as const)('distance %s is %s', (d, tier) => {
    expect(tierFor(d)).toBe(tier);
  });
});

describe('basePoints', () => {
  it('gives full marks to a perfect guess', () => {
    expect(basePoints(0)).toBe(SCORING.maxPoints);
    expect(basePoints(SCORING.tiers.perfect)).toBe(SCORING.maxPoints);
  });

  it('falls in a straight line to 0 at zeroAt (1.0)', () => {
    expect(basePoints(0.25)).toBe(75);
    expect(basePoints(0.5)).toBe(50);
    expect(basePoints(1)).toBe(0);
    expect(basePoints(1.8)).toBe(0);
  });
});

describe('combo', () => {
  it('starts at ×1 and adds 0.25 per guess in a row, up to ×2', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(comboMultiplier)).toEqual([1, 1, 1.25, 1.5, 1.75, 2, 2]);
  });

  it('grows on perfect and close guesses and resets on anything worse', () => {
    expect(scoreGuess(0.5, 0.5, 0).streak).toBe(1); // perfect
    expect(scoreGuess(0.3, 0.5, 1).streak).toBe(2); // close (0.2)
    expect(scoreGuess(0.1, 0.5, 4).streak).toBe(0); // near (0.4) breaks it
  });

  it('multiplies the points of the guess that extends it', () => {
    // Third close-or-better guess in a row: ×1.5. Distance 0.2 → 80 base points → 120.
    expect(scoreGuess(0.3, 0.5, 2)).toEqual({ distance: 0.2, tier: 'close', base: 80, streak: 3, multiplier: 1.5, points: 120 });
  });

  it('pays a broken combo at ×1', () => {
    expect(scoreGuess(-0.5, 0.5, 4)).toMatchObject({ tier: 'miss', base: 0, streak: 0, multiplier: 1, points: 0 });
  });
});

describe('moodLabel', () => {
  it.each([
    [-1, '很難過'],
    [-0.6, '很難過'],
    [-0.4, '有點難過'],
    [0, '普通'],
    [0.2, '普通'],
    [0.35, '有點開心'],
    [0.9, '很開心'],
  ] as const)('%s reads %s', (value, label) => {
    expect(moodLabel(value)).toBe(label);
  });
});

describe('formatScore', () => {
  it('always shows the sign and two decimals', () => {
    expect(formatScore(0.35)).toBe('+0.35');
    expect(formatScore(-1)).toBe('-1.00');
    expect(formatScore(0)).toBe('0.00');
  });
});
