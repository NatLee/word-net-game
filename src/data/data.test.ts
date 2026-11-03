import { describe, expect, it } from 'vitest';
import { MODES, SCORING } from '../config.ts';
import { packs, sentences } from './index.ts';
import { loadLibrary, MAX_TEXT_LENGTH, validatePack } from './validate.ts';

const good = {
  id: 'demo',
  title: 'Demo',
  language: 'zh-TW',
  source: 'test',
  sentences: [{ id: 'demo-1', text: '好開心', score: 0.8, tags: ['日常'] }],
};

describe('the bundled packs', () => {
  it('load and validate', () => {
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) expect(pack.source).toMatch(/原創/);
  });

  it('have enough sentences for every round-based mode', () => {
    for (const { rounds } of Object.values(MODES)) {
      if (rounds !== null) expect(sentences.length).toBeGreaterThanOrEqual(rounds);
    }
  });

  it('cover the whole scale, so a player who always stays in the middle cannot win', () => {
    // At least a fifth of the sentences each on the sad side, the happy side, and near neutral.
    const share = (test: (score: number) => boolean) => sentences.filter((s) => test(s.score)).length / sentences.length;
    expect(share((x) => x <= -SCORING.tiers.near)).toBeGreaterThan(0.2);
    expect(share((x) => x >= SCORING.tiers.near)).toBeGreaterThan(0.2);
    expect(share((x) => Math.abs(x) <= SCORING.tiers.close)).toBeGreaterThan(0.1);
  });

  it('use ids that are unique across packs', () => {
    expect(new Set(sentences.map((s) => s.id)).size).toBe(sentences.length);
  });
});

describe('validatePack', () => {
  it('accepts a well-formed pack and tags each sentence with its pack', () => {
    const result = validatePack(good, 'demo.json');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pack.sentences[0]).toEqual({ id: 'demo-1', text: '好開心', score: 0.8, tags: ['日常'], pack: 'demo' });
  });

  it('reports every problem with its location', () => {
    const result = validatePack(
      {
        ...good,
        title: '',
        sentences: [
          { id: 'Bad Id', text: 'x', score: 0 },
          { id: 'a', text: '', score: 2 },
          { id: 'a', text: 'y'.repeat(MAX_TEXT_LENGTH + 1), score: 'high', tags: [1], note: '' },
        ],
      },
      'bad.json',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        'bad.json title: must be a non-empty string',
        'bad.json sentences[0].id: must be lowercase letters, digits and dashes',
        'bad.json sentences[1].text: must be a non-empty string',
        'bad.json sentences[1].score: must be a number from -1 to 1',
        'bad.json sentences[2].id: duplicate id "a"',
        `bad.json sentences[2].text: longer than ${MAX_TEXT_LENGTH} characters`,
        'bad.json sentences[2].score: must be a number from -1 to 1',
        'bad.json sentences[2].tags: must be an array of strings',
        'bad.json sentences[2].note: must be a non-empty string when present',
      ]);
    }
  });

  it('rejects files that are not packs', () => {
    expect(validatePack([], 'x.json')).toEqual({ ok: false, errors: ['x.json: must be a JSON object'] });
    expect(validatePack({ ...good, sentences: [] }, 'x.json').ok).toBe(false);
  });
});

describe('loadLibrary', () => {
  it('throws one error that lists problems from every file', () => {
    const load = () => loadLibrary({ 'a.json': good, 'b.json': { ...good, id: 'other' }, 'c.json': {} });
    expect(load).toThrow(/c\.json id: must be a non-empty string/);
    expect(load).toThrow(/sentence id "demo-1" appears in more than one pack/);
    expect(() => loadLibrary({ 'a.json': good, 'b.json': good })).toThrow(/pack id "demo" is used by more than one file/);
    expect(() => loadLibrary({})).toThrow(/no sentence packs found/);
  });
});
