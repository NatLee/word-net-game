import { useCallback, useState } from 'react';
import { readStored, writeStored } from '../lib/storage.ts';

/**
 * React state that is also saved in localStorage under `name` (see lib/storage.ts), so it
 * survives a reload. `parse` checks what was saved; anything unexpected gives `fallback`.
 */
export function useStored<T>(name: string, parse: (raw: unknown) => T | null, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(name, parse, fallback));

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
        writeStored(name, resolved); // if the browser refuses, the value still lives until the tab closes
        return resolved;
      });
    },
    [name],
  );

  return [value, update] as const;
}
