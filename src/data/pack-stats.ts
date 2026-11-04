/**
 * Sentence-pack report for whoever writes sentences: how many each pack has, how the reference
 * scores spread over the mood bands, and which sentences look most alike (to catch a near copy
 * that the exact-duplicate check in validate.ts lets through).
 *
 *   npm run packs          prints the report as Markdown
 *
 * Not part of the game bundle. It reuses the game's own mood bands and text normalisation.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOOD_BANDS } from '../config.ts';
import { textKey } from './validate.ts';

interface RawSentence {
  id: string;
  text: string;
  score: number;
  note?: string;
}
interface RawPack {
  id: string;
  title: string;
  sentences: RawSentence[];
}

/** Pairs at least this alike (character-pair overlap, 0–1) are listed for a human to look at. */
const SIMILAR_AT = 0.4;
const SIMILAR_LIST = 15;

const dir = join(import.meta.dirname, 'packs');
const packs: RawPack[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

const bandOf = (score: number) => MOOD_BANDS.findIndex((b) => score <= b.upTo);
const fixed = (n: number) => n.toFixed(2);

const lines: string[] = ['# Sentence packs', ''];
const header = ['題庫', '句數', '有解說', '平均', '最低', '最高', ...MOOD_BANDS.map((b) => b.label)];
lines.push(`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`);
const all = packs.flatMap((p) => p.sentences.map((s) => ({ ...s, pack: p.id })));
for (const row of [...packs.map((p) => ({ name: `${p.title}（${p.id}）`, list: p.sentences })), { name: '全部', list: all }]) {
  const scores = row.list.map((s) => s.score);
  const bands = MOOD_BANDS.map((_, i) => scores.filter((x) => bandOf(x) === i).length);
  const cells = [
    row.name,
    row.list.length,
    row.list.filter((s) => s.note).length,
    fixed(scores.reduce((a, b) => a + b, 0) / scores.length),
    fixed(Math.min(...scores)),
    fixed(Math.max(...scores)),
    ...bands,
  ];
  lines.push(`| ${cells.join(' | ')} |`);
}

/** Character pairs of a sentence, ignoring punctuation and spaces. */
const pairsOf = (text: string) => {
  const key = textKey(text);
  return new Set(Array.from({ length: Math.max(0, key.length - 1) }, (_, i) => key.slice(i, i + 2)));
};
const grams = all.map((s) => ({ ...s, grams: pairsOf(s.text) }));
const similar: { a: (typeof grams)[number]; b: (typeof grams)[number]; score: number }[] = [];
for (let i = 0; i < grams.length; i++) {
  for (let j = i + 1; j < grams.length; j++) {
    const [a, b] = [grams[i], grams[j]];
    const shared = [...a.grams].filter((g) => b.grams.has(g)).length;
    const score = shared / (a.grams.size + b.grams.size - shared || 1);
    if (score >= SIMILAR_AT) similar.push({ a, b, score });
  }
}
similar.sort((x, y) => y.score - x.score);

lines.push('', `## 最相像的句子（重疊度 ≥ ${SIMILAR_AT}，最多 ${SIMILAR_LIST} 組）`, '');
if (similar.length === 0) lines.push('沒有。');
for (const { a, b, score } of similar.slice(0, SIMILAR_LIST)) {
  lines.push(`- ${fixed(score)}：\`${a.id}\` ${a.text} ↔ \`${b.id}\` ${b.text}`);
}
console.log(lines.join('\n'));
