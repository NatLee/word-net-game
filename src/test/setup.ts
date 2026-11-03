import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

/** Tests flip these before rendering to simulate the player's OS settings. */
export const media = { prefersDark: false, reducedMotion: false };

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');

  afterEach(() => {
    cleanup();
    localStorage.clear();
    media.prefersDark = false;
    media.reducedMotion = false;
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
  });

  // jsdom has no matchMedia.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches:
        (query.includes('prefers-color-scheme: dark') && media.prefersDark) ||
        (query.includes('prefers-reduced-motion: reduce') && media.reducedMotion),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
