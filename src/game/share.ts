import { GAME_TITLE, SCALE_DECIMALS, SHARE_SYMBOLS_PER_LINE } from '../config.ts';
import type { ModeId, Tier } from '../types.ts';
import { MODE_INFO, TIER_INFO } from './labels.ts';

export interface ShareInput {
  mode: ModeId;
  /** Shown after the mode name for the daily challenge. */
  date?: string;
  score: number;
  tiers: readonly Tier[];
  bestStreak: number;
  averageDistance: number;
  /** Where friends can play; the app passes its own address. */
  url: string;
}

/**
 * A result as plain text for chat apps: one symbol per sentence (◎ perfect, ○ close, △ near,
 * × miss) so friends see how it went without seeing the answers.
 */
/** A duo match as text: both names, the score line and who won. */
export function duoShareText(names: readonly [string, string], scores: readonly [number, number], winner: 0 | 1 | null, url: string): string {
  return [`${GAME_TITLE} 雙人對戰`, `${names[0]} ${scores[0]} : ${scores[1]} ${names[1]}`, winner === null ? '平手！' : `${names[winner]} 贏了！`, url].join('\n');
}

export function shareText(input: ShareInput): string {
  const heading = [GAME_TITLE, MODE_INFO[input.mode].title, input.date].filter(Boolean).join(' ');
  const symbols = input.tiers.map((tier) => TIER_INFO[tier].symbol);
  const rows: string[] = [];
  for (let i = 0; i < symbols.length; i += SHARE_SYMBOLS_PER_LINE) {
    rows.push(symbols.slice(i, i + SHARE_SYMBOLS_PER_LINE).join(''));
  }
  return [
    heading,
    `${input.score} 分（${input.tiers.length} 句）`,
    ...rows,
    `最高連擊 ${input.bestStreak}｜平均差距 ${input.averageDistance.toFixed(SCALE_DECIMALS)}`,
    input.url,
  ].join('\n');
}
