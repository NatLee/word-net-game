import type { Tier } from '../types.ts';

/**
 * Tailwind classes per tier, written out in full so Tailwind can find them. Text uses the darker
 * ink shade on the light theme so it stays readable (WCAG AA).
 */
export const TIER_STYLE: Record<Tier, { text: string; bg: string; ring: string; glow: string }> = {
  perfect: { text: 'text-perfect-ink dark:text-perfect', bg: 'bg-perfect', ring: 'ring-perfect/40', glow: 'var(--color-perfect)' },
  close: { text: 'text-close-ink dark:text-close', bg: 'bg-close', ring: 'ring-close/40', glow: 'var(--color-close)' },
  near: { text: 'text-near-ink dark:text-near', bg: 'bg-near', ring: 'ring-near/40', glow: 'var(--color-near)' },
  miss: { text: 'text-miss-ink dark:text-miss', bg: 'bg-miss', ring: 'ring-miss/40', glow: 'var(--color-miss)' },
};
