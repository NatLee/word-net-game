import { RANKS } from '../config.ts';
import type { Annotation } from '../types.ts';

/** Experience: every point the player has scored. */
export function xpOf(answers: readonly Annotation[]): number {
  return answers.reduce((sum, a) => sum + a.points, 0);
}

export interface Rank {
  /** 1 for the first rank. */
  level: number;
  title: string;
  minXp: number;
  /** XP where the next rank starts, or null at the top. */
  nextXp: number | null;
  /** How far into this rank, 0–1 (1 at the top rank). */
  progress: number;
}

export function rankFor(xp: number): Rank {
  const index = RANKS.findLastIndex((r) => xp >= r.minXp);
  const current = RANKS[Math.max(0, index)];
  const next = RANKS[index + 1];
  return {
    level: Math.max(0, index) + 1,
    title: current.title,
    minXp: current.minXp,
    nextXp: next?.minXp ?? null,
    progress: next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1,
  };
}

/** The rank reached when XP went from `before` to `after`, or null if the rank stayed the same. */
export function rankUp(before: number, after: number): Rank | null {
  const rank = rankFor(after);
  return rank.level > rankFor(before).level ? rank : null;
}
