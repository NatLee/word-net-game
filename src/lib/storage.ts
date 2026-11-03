/**
 * localStorage that never throws. Every GitHub Pages project site of one account shares one
 * origin (and one localStorage), so keys start with the base path the game is served from.
 */
export function storageKey(name: string, base: string = import.meta.env.BASE_URL): string {
  return `${base}word-net:${name}`;
}

/**
 * Reads a saved value. `parse` gets the decoded JSON and returns the typed value, or null when
 * it does not look right (an older format, a hand-edited value); then `fallback` is used.
 */
export function readStored<T>(name: string, parse: (raw: unknown) => T | null, fallback: T): T {
  try {
    const text = localStorage.getItem(storageKey(name));
    if (text === null) return fallback;
    return parse(JSON.parse(text)) ?? fallback;
  } catch {
    return fallback; // storage blocked (private mode, strict settings) or not JSON
  }
}

/** Saves a value; returns false when the browser refused (storage full or blocked). */
export function writeStored(name: string, value: unknown): boolean {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
