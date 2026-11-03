import { useEffect, useState } from 'react';

function matches(query: string): boolean {
  return typeof matchMedia === 'function' && matchMedia(query).matches;
}

/** Whether a media query matches, kept up to date when the OS setting changes. */
export function useMedia(query: string): boolean {
  const [value, setValue] = useState(() => matches(query));
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const list = matchMedia(query);
    const onChange = () => setValue(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return value;
}

/** True when the player asked the OS for less motion. */
export function useReducedMotion(): boolean {
  return useMedia('(prefers-reduced-motion: reduce)');
}
