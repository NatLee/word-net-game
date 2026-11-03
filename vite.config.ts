import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
import { GAME_TITLE } from './src/config.ts';
import { colorModeScript } from './src/lib/color-mode.ts';
import { resolveBase } from './src/lib/paths.ts';
import { storageKey } from './src/lib/storage.ts';

/** `BASE_PATH` from the deploy workflow (e.g. `/word-net-game/` on GitHub Pages), else `/`. */
const base = resolveBase(process.env.BASE_PATH);

/** Fills the page title from config and adds the colour-mode script, so dark mode applies before the first paint. */
function gameHtml(): Plugin {
  return {
    name: 'game-html',
    transformIndexHtml: (html) => ({
      html: html.replace('%GAME_TITLE%', GAME_TITLE),
      tags: [{ tag: 'script', children: colorModeScript(storageKey('color-mode', base), 'system'), injectTo: 'head-prepend' }],
    }),
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), gameHtml()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Vitest 5 keeps transformed files on disk between runs, but that cache does not notice a new
    // file matched by import.meta.glob: a pack added to src/data/packs/ would be skipped by the
    // tests (and by its validation) until the cache was cleared. Off until Vitest handles globs.
    fsModuleCache: false,
  },
});
