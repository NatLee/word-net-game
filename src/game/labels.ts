import { LIVES, MODES, SCORING } from '../config.ts';
import type { ModeId, Tier } from '../types.ts';

/** What each mode is called and how it is explained; the numbers come from MODES. */
export const MODE_INFO: Record<ModeId, { title: string; blurb: string }> = {
  classic: { title: '經典', blurb: `${MODES.classic.rounds} 句，慢慢想，看你有多懂人心。` },
  rush: { title: '限時', blurb: `${MODES.rush.seconds} 秒內答越多越好，揭曉時不計時。` },
  survival: { title: '生存', blurb: `${MODES.survival.lives} 顆心，失手扣一顆，連擊每 ${LIVES.healEvery} 句補一顆。撐越久越好。` },
  daily: { title: '每日挑戰', blurb: `每天同一組 ${MODES.daily.rounds} 句（從全部題庫挑），一天一次，可以分享成績。` },
};

export const MODE_ORDER: readonly ModeId[] = ['classic', 'rush', 'survival', 'daily'];

/** Name and share symbol of each tier, and the distance it covers (from SCORING). */
export const TIER_INFO: Record<Tier, { label: string; symbol: string; range: string }> = {
  perfect: { label: '完美', symbol: '◎', range: `差距 ≤ ${SCORING.tiers.perfect}` },
  close: { label: '很接近', symbol: '○', range: `差距 ≤ ${SCORING.tiers.close}` },
  near: { label: '差一點', symbol: '△', range: `差距 ≤ ${SCORING.tiers.near}` },
  miss: { label: '失手', symbol: '×', range: `差距 > ${SCORING.tiers.near}` },
};
