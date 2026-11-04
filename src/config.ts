/**
 * Every tunable value of the game lives here: scoring, round counts, timers, milestones and
 * the optional Google Form. Change a rule here; the logic reads it from this file.
 */

/** The mood scale. -1 is as sad as it gets, +1 as happy, 0 is neutral (same scale as the 2018 version). */
export const SCALE = { min: -1, max: 1 } as const;

/** Guesses are kept to this many decimals (0.01 steps), on the slider and in every record. */
export const SCALE_DECIMALS = 2;

/**
 * How a guess is scored. `distance` is |guess − reference|, from 0 (spot on) to 2.
 * Points fall in a straight line from `maxPoints` at distance 0 to nothing at `zeroAt`;
 * a perfect guess is rounded up to the full `maxPoints`.
 */
export const SCORING = {
  maxPoints: 100,
  zeroAt: 1,
  /** Upper distance of each tier, best first. Anything further is a miss. */
  tiers: { perfect: 0.1, close: 0.25, near: 0.5 },
  /** Tiers that keep the combo going. */
  comboTiers: ['perfect', 'close'],
  /** Each extra guess in a combo adds this to the multiplier, up to `comboMax`. */
  comboStep: 0.25,
  comboMax: 2,
} as const;

/** Mood words for a position on the scale: the first band whose `upTo` is ≥ the value wins. */
export const MOOD_BANDS = [
  { upTo: -0.6, label: '很難過' },
  { upTo: -0.2, label: '有點難過' },
  { upTo: 0.2, label: '普通' },
  { upTo: 0.6, label: '有點開心' },
  { upTo: 1, label: '很開心' },
] as const;

/**
 * Game modes. `rounds: null` means no fixed length: the run ends when `seconds` run out or the
 * `lives` are gone. A mode `seededByDate` deals the same sentences to everyone on the same day
 * (the daily challenge); the others shuffle every run.
 */
export const MODES = {
  classic: { rounds: 10, seconds: null, lives: null, seededByDate: false },
  rush: { rounds: null, seconds: 60, lives: null, seededByDate: false },
  survival: { rounds: null, seconds: null, lives: 3, seededByDate: false },
  daily: { rounds: 5, seconds: null, lives: null, seededByDate: true },
} as const;

/**
 * Modes with lives: a guess in one of the `loseOn` tiers costs a life, and every `healEvery`-th
 * guess of a combo gives one back, up to the starting number.
 */
export const LIVES = { loseOn: ['miss'], healEvery: 5 } as const;

/** Two players on one device take turns on the same sentences; this many per match. */
export const DUO = { rounds: 6 } as const;

/** Shared results put this many tier symbols on a line. */
export const SHARE_SYMBOLS_PER_LINE = 10;

/** The timed mode's clock turns red for the last this-many seconds. */
export const CLOCK_WARNING_SECONDS = 10;

/** In rush mode the answer stays on screen this long, then the next sentence comes (Enter skips the wait). */
export const RUSH_REVEAL_MS = 1600;

/** Keyboard control of the net: arrow keys move by `step`, Shift+arrow or PageUp/PageDown by `bigStep`. */
export const KEYBOARD = { step: 0.05, bigStep: 0.25 } as const;

/** The 2018 version congratulated the player on every 100th sentence; so does this one. */
export const MILESTONE_EVERY = 100;

/**
 * Ranks. Experience (XP) is every point the player has ever scored, so a rank is earned by
 * playing well and playing often. The first rank needs 0 XP.
 */
export const RANKS = [
  { minXp: 0, title: '見習撒網人' },
  { minXp: 500, title: '捕語學徒' },
  { minXp: 1500, title: '情緒漁夫' },
  { minXp: 3500, title: '讀心漁師' },
  { minXp: 7000, title: '共感船長' },
  { minXp: 12000, title: '心海領航員' },
  { minXp: 20000, title: '心海傳說' },
] as const;

/** How long a toast (achievement, rank up, milestone) stays on screen. */
export const TOAST_MS = 4500;

/** How many runs each mode keeps on this device's leaderboard. */
export const LEADERBOARD_SIZE = 10;

/** Longest player name, in characters. */
export const NAME_MAX_LENGTH = 20;

/** Game title, used in the page title and in shared results. */
export const GAME_TITLE = 'Word Net';

/** Where the source code lives (footer link). */
export const SOURCE_URL = 'https://github.com/NatLee/word-net-game';
