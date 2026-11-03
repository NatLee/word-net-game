import { MODES } from '../config.ts';
import type { ModeId, Sentence } from '../types.ts';
import { hashString, seededRandom, shuffle } from './random.ts';
import { round, scoreGuess, snap, type Score } from './scoring.ts';

export interface RoundResult extends Score {
  sentence: Sentence;
  guess: number;
}

export type Phase = 'guessing' | 'revealed' | 'finished';

/** One run of the game, from the first sentence to the summary. Changed only through `reduce`. */
export interface Session {
  mode: ModeId;
  /** The sentences of this run, in order. Timed modes wrap around when they run out. */
  queue: readonly Sentence[];
  /** Index of the current round, from 0. */
  round: number;
  phase: Phase;
  /** Where the net is now. Every round starts in the middle (0). */
  guess: number;
  results: RoundResult[];
  score: number;
  streak: number;
  bestStreak: number;
  /** Time left in timed modes; null when the mode has no clock. */
  timeLeftMs: number | null;
}

export type Action =
  | { type: 'move'; value: number }
  | { type: 'nudge'; by: number }
  | { type: 'lock' }
  | { type: 'next' }
  | { type: 'tick'; ms: number };

/**
 * The sentences for a run. Modes `seededByDate` use a seed made from the date, so everyone gets
 * the same set that day; the others use `random` (Math.random unless a test passes its own).
 */
export function dealSentences(
  mode: ModeId,
  pool: readonly Sentence[],
  date: string,
  random: () => number = Math.random,
): Sentence[] {
  const { rounds, seededByDate } = MODES[mode];
  const order = shuffle(pool, seededByDate ? seededRandom(hashString(`${mode}:${date}`)) : random);
  return rounds === null ? order : order.slice(0, rounds);
}

export function createSession(mode: ModeId, queue: readonly Sentence[]): Session {
  if (queue.length === 0) throw new Error('A session needs at least one sentence');
  const { seconds } = MODES[mode];
  return {
    mode,
    queue,
    round: 0,
    phase: 'guessing',
    guess: 0,
    results: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    timeLeftMs: seconds === null ? null : seconds * 1000,
  };
}

export function currentSentence(session: Session): Sentence {
  return session.queue[session.round % session.queue.length];
}

/** Rounds in this run, or null for timed modes. */
export function totalRounds(session: Session): number | null {
  const { rounds } = MODES[session.mode];
  return rounds === null ? null : Math.min(rounds, session.queue.length);
}

export function isLastRound(session: Session): boolean {
  const total = totalRounds(session);
  return total !== null && session.round + 1 >= total;
}

export function lastResult(session: Session): RoundResult | undefined {
  return session.results[session.results.length - 1];
}

export function reduce(session: Session, action: Action): Session {
  switch (action.type) {
    case 'move':
      return session.phase === 'guessing' ? { ...session, guess: snap(action.value) } : session;
    case 'nudge':
      return session.phase === 'guessing' ? { ...session, guess: snap(session.guess + action.by) } : session;
    case 'lock': {
      if (session.phase !== 'guessing') return session;
      const sentence = currentSentence(session);
      const result: RoundResult = { ...scoreGuess(session.guess, sentence.score, session.streak), sentence, guess: session.guess };
      return {
        ...session,
        phase: 'revealed',
        results: [...session.results, result],
        score: session.score + result.points,
        streak: result.streak,
        bestStreak: Math.max(session.bestStreak, result.streak),
      };
    }
    case 'next':
      if (session.phase !== 'revealed') return session;
      if (isLastRound(session)) return { ...session, phase: 'finished' };
      return { ...session, phase: 'guessing', round: session.round + 1, guess: 0 };
    case 'tick': {
      // The clock only runs while the player is guessing; the reveal is free time.
      if (session.phase !== 'guessing' || session.timeLeftMs === null) return session;
      const timeLeftMs = Math.max(0, session.timeLeftMs - action.ms);
      return { ...session, timeLeftMs, phase: timeLeftMs === 0 ? 'finished' : session.phase };
    }
  }
}

export interface Summary {
  score: number;
  rounds: number;
  /** Mean distance between guess and reference, 0–2 (0 when nothing was answered). */
  averageDistance: number;
  bestStreak: number;
  perfects: number;
}

export function summarize(session: Session): Summary {
  const { results } = session;
  const total = results.reduce((sum, r) => sum + r.distance, 0);
  return {
    score: session.score,
    rounds: results.length,
    averageDistance: results.length ? round(total / results.length) : 0,
    bestStreak: session.bestStreak,
    perfects: results.filter((r) => r.tier === 'perfect').length,
  };
}
