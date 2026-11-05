import { testFeedback } from '../test/fixtures.ts';
import { describe, expect, it } from 'vitest';
import { MODES, SCORING } from '../config.ts';
import { packs, sentences } from './index.ts';
import { loadLibrary, MAX_TEXT_LENGTH, validatePack } from './validate.ts';

const good = {
  id: 'demo',
  title: 'Demo',
  language: 'zh-TW',
  source: 'test',
  license: 'CC0-1.0',
  sentences: [{ id: 'demo-1', text: '好開心', score: 0.8, tags: ['日常'], feedback: testFeedback }],
};

describe('the bundled packs', () => {
  it('provides five authored feedback branches for every sentence', () => {
    expect(sentences.length).toBeGreaterThanOrEqual(600);
    for (const sentence of sentences) {
      for (const key of ['hit', 'edge', 'higher', 'lower', 'neutral'] as const) {
        expect(sentence.feedback[key].length, `${sentence.id}: ${key}`).toBeGreaterThan(0);
        for (const line of sentence.feedback[key]) expect(line.trim().length).toBeGreaterThan(0);
      }
    }
  });
  it('load and validate', () => {
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) expect(pack.source).toMatch(/原創/);
  });

  it('are all CC BY 4.0, as src/data/packs/LICENSE says', () => {
    for (const pack of packs) expect(pack.license, pack.id).toBe('CC-BY-4.0');
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

  it('lean both ways inside every pack, not just overall', () => {
    // Each pack needs at least 15% of its sentences clearly sad and 15% clearly happy (past ±0.25),
    // so picking a single pack is still a real game.
    for (const pack of packs) {
      const share = (test: (score: number) => boolean) => pack.sentences.filter((s) => test(s.score)).length / pack.sentences.length;
      expect(share((x) => x <= -SCORING.tiers.close), `${pack.id} sad side`).toBeGreaterThanOrEqual(0.15);
      expect(share((x) => x >= SCORING.tiers.close), `${pack.id} happy side`).toBeGreaterThanOrEqual(0.15);
    }
  });

  it('use ids that are unique across packs', () => {
    expect(new Set(sentences.map((s) => s.id)).size).toBe(sentences.length);
  });
});

describe('validatePack', () => {
  it('accepts a well-formed pack and tags each sentence with its pack', () => {
    const result = validatePack(good, 'demo.json');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pack.sentences[0]).toEqual({ id: 'demo-1', text: '好開心', score: 0.8, tags: ['日常'], feedback: testFeedback, pack: 'demo' });
  });

  it('reports every problem with its location', () => {
    const result = validatePack(
      {
        ...good,
        title: '',
        sentences: [
          { id: 'Bad Id', text: 'x', score: 0, feedback: testFeedback },
          { id: 'a', text: '', score: 2, feedback: testFeedback },
          { id: 'a', text: 'y'.repeat(MAX_TEXT_LENGTH + 1), score: 'high', tags: [1], note: '', feedback: testFeedback },
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

  it('requires a license', () => {
    expect(validatePack({ ...good, license: undefined }, 'x.json')).toEqual({ ok: false, errors: ['x.json license: must be a non-empty string'] });
  });

  it('rejects missing, blank and repeated feedback variants with their locations', () => {
    const withFeedback = (feedback: unknown) => ({ ...good, sentences: [{ ...good.sentences[0], feedback }] });
    expect(validatePack(withFeedback(undefined), 'x.json')).toEqual({ ok: false, errors: ['x.json sentences[0].feedback: must contain sentence-specific feedback'] });
    for (const key of ['hit', 'edge', 'higher', 'lower', 'neutral']) {
      for (const invalid of [undefined, [], [''], ['a', ' a！']]) {
        const result = validatePack(withFeedback({ ...testFeedback, [key]: invalid }), 'x.json');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.errors[0]).toContain(`feedback.${key}`);
      }
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

  it('rejects the same sentence twice, even with different punctuation', () => {
    const twin = { ...good, id: 'twin', sentences: [{ id: 'twin-1', text: '好 開心！', score: 0.5, tags: [], feedback: testFeedback }] };
    expect(() => loadLibrary({ 'a.json': good, 'b.json': twin })).toThrow(/sentence "twin-1" has the same text as "demo-1"/);
  });
});
