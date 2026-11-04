import { DUO } from '../config.ts';
import type { Sentence } from '../types.ts';
import { scoreGuess, snap, type Score } from './scoring.ts';

export interface DuoPlayer {
  name: string;
  /** One score per finished round. */
  results: Score[];
  /** This round's locked guess, hidden until both have cast. */
  guess: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  /** Rounds this player won outright. */
  wins: number;
}

/** A two-player match on one device: both judge the same sentence, one after the other. */
export interface DuoSession {
  queue: readonly Sentence[];
  round: number;
  /** Whose turn it is: 0 or 1. */
  turn: 0 | 1;
  phase: 'guessing' | 'revealed' | 'finished';
  /** Where the net of the player whose turn it is sits now. */
  guess: number;
  players: [DuoPlayer, DuoPlayer];
}

export type DuoAction = { type: 'move'; value: number } | { type: 'nudge'; by: number } | { type: 'lock' } | { type: 'next' };

const player = (name: string): DuoPlayer => ({ name, results: [], guess: null, score: 0, streak: 0, bestStreak: 0, wins: 0 });

export function createDuo(names: [string, string], queue: readonly Sentence[]): DuoSession {
  if (queue.length === 0) throw new Error('A match needs at least one sentence');
  return { queue: queue.slice(0, DUO.rounds), round: 0, turn: 0, phase: 'guessing', guess: 0, players: [player(names[0]), player(names[1])] };
}

export const duoSentence = (s: DuoSession) => s.queue[s.round];
export const duoRounds = (s: DuoSession) => s.queue.length;

/** Who won a round: the index of the player with more points, or null for a tie. */
export function roundWinner(a: Score, b: Score): 0 | 1 | null {
  if (a.points === b.points) return null;
  return a.points > b.points ? 0 : 1;
}

/** Who won the match: more points; on equal points, more rounds won; otherwise a draw (null). */
export function matchWinner(s: DuoSession): 0 | 1 | null {
  const [a, b] = s.players;
  if (a.score !== b.score) return a.score > b.score ? 0 : 1;
  if (a.wins !== b.wins) return a.wins > b.wins ? 0 : 1;
  return null;
}

function scored(p: DuoPlayer, score: Score, won: boolean): DuoPlayer {
  return {
    ...p,
    results: [...p.results, score],
    score: p.score + score.points,
    streak: score.streak,
    bestStreak: Math.max(p.bestStreak, score.streak),
    wins: p.wins + (won ? 1 : 0),
  };
}

export function reduceDuo(s: DuoSession, action: DuoAction): DuoSession {
  switch (action.type) {
    case 'move':
      return s.phase === 'guessing' ? { ...s, guess: snap(action.value) } : s;
    case 'nudge':
      return s.phase === 'guessing' ? { ...s, guess: snap(s.guess + action.by) } : s;
    case 'lock': {
      if (s.phase !== 'guessing') return s;
      if (s.turn === 0) {
        // The first net is hidden; the second player starts from the middle.
        return { ...s, turn: 1, guess: 0, players: [{ ...s.players[0], guess: s.guess }, s.players[1]] };
      }
      const reference = duoSentence(s).score;
      const [a, b] = s.players;
      const scoreA = scoreGuess(a.guess ?? 0, reference, a.streak);
      const scoreB = scoreGuess(s.guess, reference, b.streak);
      const winner = roundWinner(scoreA, scoreB);
      return {
        ...s,
        phase: 'revealed',
        players: [scored(a, scoreA, winner === 0), scored({ ...b, guess: s.guess }, scoreB, winner === 1)],
      };
    }
    case 'next': {
      if (s.phase !== 'revealed') return s;
      if (s.round + 1 >= duoRounds(s)) return { ...s, phase: 'finished' };
      const clear = (p: DuoPlayer): DuoPlayer => ({ ...p, guess: null });
      return { ...s, phase: 'guessing', round: s.round + 1, turn: 0, guess: 0, players: [clear(s.players[0]), clear(s.players[1])] };
    }
  }
}
