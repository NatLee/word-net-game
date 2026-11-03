import { useEffect } from 'react';
import { applyColorMode, COLOR_MODES, isColorMode } from '../lib/color-mode.ts';
import { storageKey } from '../lib/storage.ts';
import type { ColorMode } from '../types.ts';
import { useMedia } from './useMedia.ts';
import { useStored } from './useStored.ts';

const parse = (raw: unknown) => (isColorMode(raw) ? raw : null);

/**
 * The player's colour mode, saved for the next visit; `system` follows the OS live. The page is
 * painted by applyColorMode, the same function the <head> script runs before the first paint.
 */
export function useColorMode(defaultMode: ColorMode = 'system') {
  const [mode, setMode] = useStored<ColorMode>('color-mode', parse, defaultMode);
  const systemDark = useMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    applyColorMode(storageKey('color-mode'), defaultMode, mode, COLOR_MODES);
  }, [defaultMode, mode, systemDark]);

  return { mode, setMode, dark: mode === 'dark' || (mode === 'system' && systemDark) };
}
