import { MODES } from '../config.ts';
import { TIERS } from '../game/scoring.ts';
import type { Annotation, DailyRecord, ModeId, PlayMode, RunRecord } from '../types.ts';

const MODE_IDS = Object.keys(MODES) as ModeId[];

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isMode = (v: unknown): v is ModeId => isString(v) && (MODE_IDS as string[]).includes(v);
const isPlayMode = (v: unknown): v is PlayMode => v === 'duo' || isMode(v);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// Parsers for what comes back from localStorage: entries that don't fit the format are dropped.

export function parseAnnotations(raw: unknown): Annotation[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (a): a is Annotation =>
      isObject(a) &&
      isString(a.sentenceId) &&
      isString(a.text) &&
      isNumber(a.guess) &&
      isNumber(a.reference) &&
      isPlayMode(a.mode) &&
      (a.guest === undefined || typeof a.guest === 'boolean') &&
      isString(a.name) &&
      isNumber(a.points) &&
      isString(a.at),
  );
}

/** Unlocked achievements: id → ISO time of unlocking. */
export function parseUnlocked(raw: unknown): Record<string, string> | null {
  if (!isObject(raw) || Array.isArray(raw)) return null;
  return Object.fromEntries(Object.entries(raw).filter(([, at]) => isString(at))) as Record<string, string>;
}

export function parseRuns(raw: unknown): RunRecord[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (r): r is RunRecord =>
      isObject(r) &&
      isMode(r.mode) &&
      isString(r.name) &&
      isNumber(r.score) &&
      isNumber(r.rounds) &&
      isNumber(r.bestStreak) &&
      isNumber(r.averageDistance) &&
      isString(r.at),
  );
}

export function parseDaily(raw: unknown): Record<string, DailyRecord> | null {
  if (!isObject(raw) || Array.isArray(raw)) return null;
  const out: Record<string, DailyRecord> = {};
  for (const [date, r] of Object.entries(raw)) {
    if (
      isObject(r) &&
      r.date === date &&
      isNumber(r.score) &&
      Array.isArray(r.tiers) &&
      r.tiers.every((t) => (TIERS as unknown[]).includes(t)) &&
      isNumber(r.bestStreak) &&
      isNumber(r.averageDistance)
    ) {
      out[date] = r as unknown as DailyRecord;
    }
  }
  return out;
}

/**
 * The milestone reached when the answer count went from `before` to `after` (e.g. 100, 200), or
 * null. The 2018 version congratulated on every hundredth sentence; `every` comes from config.
 */
export function crossedMilestone(before: number, after: number, every: number): number | null {
  const reached = Math.floor(after / every);
  return reached > Math.floor(before / every) ? reached * every : null;
}

/** Adds a run and keeps only the best `size` runs of each mode (higher score first, then the older run). */
export function addRun(runs: readonly RunRecord[], run: RunRecord, size: number): RunRecord[] {
  const all = [...runs, run];
  return MODE_IDS.flatMap((mode) => rankRuns(all, mode).slice(0, size));
}

export function rankRuns(runs: readonly RunRecord[], mode: ModeId): RunRecord[] {
  return runs.filter((r) => r.mode === mode).sort((a, b) => b.score - a.score || a.at.localeCompare(b.at));
}

/**
 * How many different sentences each name has labelled, most first: the ranking the 2018
 * version showed (it counted unique sentences per name in the Google Sheet).
 */
export function labelCounts(annotations: readonly Annotation[]): { name: string; count: number }[] {
  const byName = new Map<string, Set<string>>();
  for (const a of annotations) {
    const name = a.name.trim();
    if (!byName.has(name)) byName.set(name, new Set());
    byName.get(name)!.add(a.sentenceId);
  }
  return [...byName]
    .map(([name, ids]) => ({ name, count: ids.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
