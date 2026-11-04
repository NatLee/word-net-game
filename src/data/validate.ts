import { SCALE } from '../config.ts';
import type { Sentence, SentencePack } from '../types.ts';

/** Longest sentence the card is laid out for, in characters. */
export const MAX_TEXT_LENGTH = 60;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The text with punctuation, symbols and spaces removed: two sentences that only differ in those are the same sentence. */
export function textKey(text: string): string {
  return text.replace(/[\s\p{P}\p{S}]/gu, '');
}

export type PackResult = { ok: true; pack: SentencePack } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks one pack file and returns it typed, or every problem found (not just the first), each
 * prefixed with where it is, so a broken file can be fixed in one go.
 */
export function validatePack(raw: unknown, file: string): PackResult {
  const errors: string[] = [];
  const fail = (where: string, message: string) => errors.push(`${file}${where}: ${message}`);

  if (!isRecord(raw)) return { ok: false, errors: [`${file}: must be a JSON object`] };

  for (const key of ['id', 'title', 'language', 'source', 'license'] as const) {
    if (!nonEmptyString(raw[key])) fail(` ${key}`, 'must be a non-empty string');
  }
  if (nonEmptyString(raw.id) && !ID_PATTERN.test(raw.id)) fail(' id', 'use lowercase letters, digits and dashes');
  if (!Array.isArray(raw.sentences) || raw.sentences.length === 0) {
    fail(' sentences', 'must be a non-empty array');
    return { ok: false, errors };
  }

  const seen = new Set<string>();
  const sentences: Sentence[] = [];
  raw.sentences.forEach((item: unknown, i: number) => {
    const where = ` sentences[${i}]`;
    if (!isRecord(item)) {
      fail(where, 'must be an object');
      return;
    }
    const { id, text, score, tags = [], note } = item;
    if (!nonEmptyString(id) || !ID_PATTERN.test(id)) fail(`${where}.id`, 'must be lowercase letters, digits and dashes');
    else if (seen.has(id)) fail(`${where}.id`, `duplicate id "${id}"`);
    else seen.add(id);
    if (!nonEmptyString(text)) fail(`${where}.text`, 'must be a non-empty string');
    else if ([...text].length > MAX_TEXT_LENGTH) fail(`${where}.text`, `longer than ${MAX_TEXT_LENGTH} characters`);
    if (typeof score !== 'number' || !Number.isFinite(score) || score < SCALE.min || score > SCALE.max) {
      fail(`${where}.score`, `must be a number from ${SCALE.min} to ${SCALE.max}`);
    }
    if (!Array.isArray(tags) || !tags.every(nonEmptyString)) fail(`${where}.tags`, 'must be an array of strings');
    if (note !== undefined && !nonEmptyString(note)) fail(`${where}.note`, 'must be a non-empty string when present');
    sentences.push({
      id: id as string,
      text: typeof text === 'string' ? text.trim() : '',
      score: score as number,
      tags: Array.isArray(tags) ? (tags as string[]) : [],
      ...(nonEmptyString(note) ? { note: note.trim() } : {}),
      pack: raw.id as string,
    });
  });

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    pack: {
      id: raw.id as string,
      title: raw.title as string,
      language: raw.language as string,
      source: raw.source as string,
      license: raw.license as string,
      sentences,
    },
  };
}

/**
 * Validates every pack file and the library as a whole (pack ids and sentence ids must be unique
 * across files). Throws one error listing every problem, so a bad pack fails the tests and the
 * dev server loudly instead of shipping a half-loaded game.
 */
export function loadLibrary(files: Record<string, unknown>): SentencePack[] {
  const errors: string[] = [];
  const packs: SentencePack[] = [];
  for (const [file, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const result = validatePack(raw, file);
    if (result.ok) packs.push(result.pack);
    else errors.push(...result.errors);
  }

  const packIds = new Set<string>();
  const sentenceIds = new Set<string>();
  const texts = new Map<string, string>();
  for (const pack of packs) {
    if (packIds.has(pack.id)) errors.push(`pack id "${pack.id}" is used by more than one file`);
    packIds.add(pack.id);
    for (const sentence of pack.sentences) {
      if (sentenceIds.has(sentence.id)) errors.push(`sentence id "${sentence.id}" appears in more than one pack`);
      sentenceIds.add(sentence.id);
      const same = texts.get(textKey(sentence.text));
      if (same) errors.push(`sentence "${sentence.id}" has the same text as "${same}"`);
      else texts.set(textKey(sentence.text), sentence.id);
    }
  }
  if (packs.length === 0 && errors.length === 0) errors.push('no sentence packs found');

  if (errors.length) throw new Error(`Sentence packs are invalid:\n- ${errors.join('\n- ')}`);
  return packs;
}
