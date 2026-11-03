import type { Sentence } from '../types.ts';
import { loadLibrary } from './validate.ts';

/**
 * Every JSON file in ./packs is a sentence pack; adding a file adds its sentences to the game.
 * Vite bundles them at build time, and loadLibrary() checks them (see validate.ts).
 */
const files = import.meta.glob<unknown>('./packs/*.json', { eager: true, import: 'default' });

export const packs = loadLibrary(files);

/** All sentences from all packs, in file order. */
export const sentences: readonly Sentence[] = packs.flatMap((pack) => pack.sentences);
