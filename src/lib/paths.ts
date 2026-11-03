/** A base path in the `/x/` form Vite expects: one leading and one trailing slash, `/` for the root. */
export function normalizeBase(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/**
 * The path the game is served from: `BASE_PATH` when set (the deploy workflow sets it from
 * GitHub Pages, e.g. `/word-net-game/`), otherwise the root, which is what `npm run dev` uses.
 */
export function resolveBase(basePathEnv: string | undefined): string {
  return basePathEnv === undefined ? '/' : normalizeBase(basePathEnv);
}

/** The address of the game itself, e.g. for shared results. */
export function gameUrl(origin: string = location.origin, base: string = import.meta.env.BASE_URL): string {
  return new URL(base, origin).href;
}
