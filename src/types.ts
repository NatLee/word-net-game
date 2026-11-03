import type { MODES } from './config.ts';

export type ModeId = keyof typeof MODES;

/** How close a guess was, best first. */
export type Tier = 'perfect' | 'close' | 'near' | 'miss';

export type ColorMode = 'system' | 'light' | 'dark';

/** One sentence to judge, with the reference score it is compared against. */
export interface Sentence {
  /** Unique across all packs; records and the daily challenge refer to it. */
  id: string;
  text: string;
  /** Reference mood from -1 (very sad) to +1 (very happy). */
  score: number;
  tags: readonly string[];
  /** Shown after the reveal, e.g. to explain sarcasm. */
  note?: string;
  /** Id of the pack it came from. */
  pack: string;
}

/** A file in src/data/packs/. */
export interface SentencePack {
  id: string;
  title: string;
  /** BCP 47 language tag of the sentences, e.g. zh-TW. */
  language: string;
  /** Where the sentences and scores come from, and under which terms. */
  source: string;
  sentences: Sentence[];
}

/** One answered sentence, kept on this device and exportable as JSON/CSV. */
export interface Annotation {
  sentenceId: string;
  text: string;
  guess: number;
  reference: number;
  mode: ModeId;
  name: string;
  /** ISO 8601 time of the answer. */
  at: string;
  /** ISO 8601 time it was sent to the Google Form, if it was. */
  sentAt?: string;
}

/** A finished run on the device leaderboard. */
export interface RunRecord {
  mode: ModeId;
  name: string;
  score: number;
  rounds: number;
  bestStreak: number;
  /** Mean distance between guess and reference, 0–2. */
  averageDistance: number;
  at: string;
}

/** The result of one day's daily challenge. */
export interface DailyRecord {
  date: string;
  score: number;
  tiers: Tier[];
  bestStreak: number;
  averageDistance: number;
}
