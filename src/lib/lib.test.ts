import { describe, expect, it, vi } from 'vitest';
import { ANNOTATION_FORM, LEADERBOARD_SIZE, MILESTONE_EVERY } from '../config.ts';
import type { Annotation, RunRecord } from '../types.ts';
import { applyColorMode, colorModeScript, nextMode } from './color-mode.ts';
import { formBody, sendAnnotations } from './google-form.ts';
import { gameUrl, normalizeBase, resolveBase } from './paths.ts';
import {
  addRun,
  annotationsToCSV,
  annotationsToJSON,
  crossedMilestone,
  labelCounts,
  parseAnnotations,
  parseDaily,
  parseRuns,
  rankRuns,
} from './records.ts';
import { readStored, storageKey, writeStored } from './storage.ts';

const answer = (over: Partial<Annotation> = {}): Annotation => ({
  sentenceId: 'day-001',
  text: '終於放假了',
  guess: 0.8,
  reference: 0.85,
  mode: 'classic',
  name: '小明',
  at: '2026-11-04T08:00:00.000Z',
  ...over,
});

const runRecord = (score: number, at: string, mode: RunRecord['mode'] = 'classic'): RunRecord => ({
  mode,
  name: '小明',
  score,
  rounds: 10,
  bestStreak: 2,
  averageDistance: 0.2,
  at,
});

describe('storage', () => {
  it('namespaces keys with the base path (all Pages sites of an account share one origin)', () => {
    expect(storageKey('name', '/word-net-game/')).toBe('/word-net-game/word-net:name');
  });

  it('round-trips JSON and falls back on missing, broken or unexpected values', () => {
    const asString = (v: unknown) => (typeof v === 'string' ? v : null);
    expect(readStored('name', asString, 'none')).toBe('none');
    expect(writeStored('name', '小明')).toBe(true);
    expect(readStored('name', asString, 'none')).toBe('小明');
    localStorage.setItem(storageKey('name'), '{not json');
    expect(readStored('name', asString, 'none')).toBe('none');
    writeStored('name', 42);
    expect(readStored('name', asString, 'none')).toBe('none');
  });

  it('reports a refused write instead of throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(writeStored('name', 'x')).toBe(false);
    spy.mockRestore();
  });
});

describe('record parsers', () => {
  it('keep valid entries and drop broken ones', () => {
    expect(parseAnnotations([answer(), { ...answer(), guess: 'x' }, null])).toEqual([answer()]);
    expect(parseAnnotations('nope')).toBeNull();
    expect(parseRuns([runRecord(5, 'a'), { mode: 'nope' }])).toEqual([runRecord(5, 'a')]);
    const day = { date: '2026-11-04', score: 300, tiers: ['perfect', 'miss'], bestStreak: 1, averageDistance: 0.3 };
    expect(parseDaily({ '2026-11-04': day, '2026-11-05': { ...day }, x: 1 })).toEqual({ '2026-11-04': day });
  });
});

describe('crossedMilestone', () => {
  it('fires once per hundred answers', () => {
    expect(MILESTONE_EVERY).toBe(100); // the 2018 version's number
    expect(crossedMilestone(98, 99, 100)).toBeNull();
    expect(crossedMilestone(99, 100, 100)).toBe(100);
    expect(crossedMilestone(100, 101, 100)).toBeNull();
    expect(crossedMilestone(195, 205, 100)).toBe(200);
  });
});

describe('leaderboard', () => {
  it('keeps the best runs of each mode, ties going to the earlier run', () => {
    let runs: RunRecord[] = [];
    for (let i = 0; i < LEADERBOARD_SIZE + 2; i++) runs = addRun(runs, runRecord(i * 10, `2026-11-04T0${i % 10}:00`), LEADERBOARD_SIZE);
    runs = addRun(runs, runRecord(50, '2026-11-03T00:00'), LEADERBOARD_SIZE);
    runs = addRun(runs, runRecord(999, '2026-11-04T00:00', 'rush'), LEADERBOARD_SIZE);
    const classic = rankRuns(runs, 'classic');
    expect(classic).toHaveLength(LEADERBOARD_SIZE);
    expect(classic[0].score).toBe((LEADERBOARD_SIZE + 1) * 10);
    const fifties = classic.filter((r) => r.score === 50);
    expect(fifties.map((r) => r.at)).toEqual(['2026-11-03T00:00', '2026-11-04T05:00']);
    expect(rankRuns(runs, 'rush')).toHaveLength(1);
  });

  it('counts different sentences per name, like the 2018 ranking', () => {
    const list = [
      answer(),
      answer({ at: 'later' }), // same sentence again: still 1
      answer({ sentenceId: 'day-002' }),
      answer({ name: '阿華' }),
      answer({ name: ' 阿華 ', sentenceId: 'day-003' }),
      answer({ name: '小美', sentenceId: 'day-004' }),
    ];
    expect(labelCounts(list)).toEqual([
      { name: '小明', count: 2 },
      { name: '阿華', count: 2 },
      { name: '小美', count: 1 },
    ]);
  });
});

describe('exports', () => {
  it('writes CSV that Excel reads as UTF-8 and that survives commas, quotes and new lines', () => {
    const csv = annotationsToCSV([answer({ text: '他說："好，\n就這樣"', sentAt: '2026-11-04T09:00:00.000Z' })]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const [header, row] = csv.slice(1).split('\r\n');
    expect(header).toBe('at,name,mode,sentenceId,text,guess,reference,distance,sentAt');
    expect(row).toBe('2026-11-04T08:00:00.000Z,小明,classic,day-001,"他說：""好，\n就這樣""",0.80,0.85,0.05,2026-11-04T09:00:00.000Z');
  });

  it('writes JSON with a count and the time of export', () => {
    expect(JSON.parse(annotationsToJSON([answer()], '2026-11-04T10:00:00.000Z'))).toEqual({
      exportedAt: '2026-11-04T10:00:00.000Z',
      count: 1,
      annotations: [answer()],
    });
  });
});

describe('Google Form', () => {
  const target = ANNOTATION_FORM!;

  it('fills the same three fields the 2018 version sent', () => {
    expect(Object.fromEntries(formBody(target, answer()))).toEqual({
      'entry.1306234642': '小明',
      'entry.404300076': '終於放假了',
      'entry.43544314': '0.8',
    });
  });

  it('posts each answer in no-cors mode and stamps the ones that went out', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null))
      .mockRejectedValueOnce(new TypeError('offline'));
    const now = () => new Date('2026-11-04T09:00:00.000Z');
    const result = await sendAnnotations(target, [answer(), answer({ sentenceId: 'day-002' })], fetchImpl, now);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe(target.action);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: 'POST', mode: 'no-cors' });
    expect(result).toEqual({ sent: [answer({ sentAt: '2026-11-04T09:00:00.000Z' })], failed: 1 });
  });
});

describe('paths', () => {
  it('normalises the base path from the deploy workflow', () => {
    expect(normalizeBase('/word-net-game')).toBe('/word-net-game/');
    expect(normalizeBase('')).toBe('/');
    expect(resolveBase(undefined)).toBe('/');
    expect(resolveBase('/word-net-game/')).toBe('/word-net-game/');
  });

  it('builds the game address from the origin and base', () => {
    expect(gameUrl('https://natlee.github.io', '/word-net-game/')).toBe('https://natlee.github.io/word-net-game/');
  });
});

describe('color mode', () => {
  const key = storageKey('color-mode');
  const modes = ['system', 'light', 'dark'];

  it('cycles system → light → dark', () => {
    expect([nextMode('system'), nextMode('light'), nextMode('dark')]).toEqual(['light', 'dark', 'system']);
  });

  it('reads the saved choice, as JSON, the way the app saves it', () => {
    writeStored('color-mode', 'dark');
    expect(applyColorMode(key, 'system', null, modes)).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('the head script is the same function, ready to run before the app loads', () => {
    writeStored('color-mode', 'dark');
    new Function(colorModeScript(key, 'system'))();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
