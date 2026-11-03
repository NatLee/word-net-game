import { NAME_MAX_LENGTH } from '../config.ts';

/** The cleaned-up player name (spaces trimmed and collapsed), or null when it is empty or too long. */
export function validName(value: string): string | null {
  const name = value.trim().replace(/s+/g, ' ');
  return name && [...name].length <= NAME_MAX_LENGTH ? name : null;
}

/** Reads a saved name back from storage. */
export function parseName(raw: unknown): string | null {
  return typeof raw === 'string' ? validName(raw) : null;
}
