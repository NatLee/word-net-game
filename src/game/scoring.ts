import { MOOD_BANDS, SCALE, SCALE_DECIMALS, SCORING } from '../config.ts';
import type { Tier } from '../types.ts';

/** Rounds to the precision the game works in (0.01). */
export function round(value: number): number {
  const factor = 10 ** SCALE_DECIMALS;
  // `+ 0` turns -0 into 0, so a centred net reads "0", not "-0".
  return Math.round(value * factor) / factor + 0;
}

/** Rounds a position to 0.01 and keeps it on the scale. */
export function snap(value: number): number {
  return round(Math.min(SCALE.max, Math.max(SCALE.min, value)));
}

/** How far a guess is from the reference: 0 (spot on) to 2 (opposite ends). */
export function distance(guess: number, reference: number): number {
  return round(Math.abs(guess - reference));
}

/** Every tier, best first. */
export const TIERS: readonly Tier[] = ['perfect', 'close', 'near', 'miss'];

const TIER_LIMITS = Object.entries(SCORING.tiers) as [Exclude<Tier, 'miss'>, number][];

export function tierFor(d: number): Tier {
  return TIER_LIMITS.find(([, upTo]) => d <= upTo)?.[0] ?? 'miss';
}

/** Points before the combo: full marks for a perfect guess, then a straight line down to 0 at `zeroAt`. */
export function basePoints(d: number): number {
  if (tierFor(d) === 'perfect') return SCORING.maxPoints;
  return Math.round(SCORING.maxPoints * Math.max(0, 1 - d / SCORING.zeroAt));
}

export function keepsCombo(tier: Tier): boolean {
  return (SCORING.comboTiers as readonly Tier[]).includes(tier);
}

/** Multiplier for the n-th guess in a row that kept the combo (1 → ×1, 2 → ×1.25, … up to comboMax). */
export function comboMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  return Math.min(SCORING.comboMax, 1 + SCORING.comboStep * (streak - 1));
}

export interface Score {
  distance: number;
  tier: Tier;
  base: number;
  /** Combo length including this guess (0 when this guess broke it). */
  streak: number;
  multiplier: number;
  points: number;
}

/** Scores one guess, given the combo the player had before it. */
export function scoreGuess(guess: number, reference: number, previousStreak: number): Score {
  const d = distance(guess, reference);
  const tier = tierFor(d);
  const base = basePoints(d);
  const streak = keepsCombo(tier) ? previousStreak + 1 : 0;
  const multiplier = comboMultiplier(streak);
  return { distance: d, tier, base, streak, multiplier, points: Math.round(base * multiplier) };
}

/** The words for a position on the scale ("有點開心"). */
export function moodLabel(value: number): string {
  return (MOOD_BANDS.find((band) => value <= band.upTo) ?? MOOD_BANDS[MOOD_BANDS.length - 1]).label;
}

/** A scale value with its sign, e.g. "+0.35", "-1.00", "0.00". */
export function formatScore(value: number): string {
  const text = Math.abs(value).toFixed(SCALE_DECIMALS);
  if (value > 0) return `+${text}`;
  if (value < 0) return `-${text}`;
  return text;
}
