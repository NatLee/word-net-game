import { forwardRef, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { KEYBOARD, MOOD_BANDS, SCALE } from '../config.ts';
import { digitValue, percentOf, valueAt } from '../game/scale.ts';
import { formatScore, keepsCombo, moodLabel } from '../game/scoring.ts';
import type { Tier } from '../types.ts';
import { TIER_STYLE } from './tiers.ts';
import { Face } from './ui.tsx';

interface SpectrumProps {
  value: number;
  onChange: (value: number) => void;
  onNudge: (by: number) => void;
  /** Enter or Space on the slider: lock the guess in. */
  onCommit: () => void;
  /** After the lock: the reference score and how close the guess was. */
  reveal?: { reference: number; tier: Tier } | null;
}

/**
 * The mood scale with the player's net on it. Drag or tap to move the net (mouse, touch, pen),
 * or use the keyboard: arrows step 0.05, Shift+arrows and PageUp/PageDown step 0.25, Home/End
 * jump to the ends, 1–9 jump to fixed points, Enter or Space locks the guess.
 */
/** Where the burst particles fly, as offsets in px: an even ring, so it looks the same every time. */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const reach = i % 2 ? 34 : 52;
  return { dx: `${Math.round(Math.cos(angle) * reach)}px`, dy: `${Math.round(Math.sin(angle) * reach)}px` };
});

export const Spectrum = forwardRef<HTMLDivElement, SpectrumProps>(function Spectrum({ value, onChange, onNudge, onCommit, reveal }, ref) {
  const track = useRef<HTMLDivElement>(null);
  const locked = Boolean(reveal);

  const fromPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return value;
    return valueAt((clientX - box.left) / box.width);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    onChange(fromPointer(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || !event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
    onChange(fromPointer(event.clientX));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const step = event.shiftKey ? KEYBOARD.bigStep : KEYBOARD.step;
    const digit = /^[1-9]$/.test(event.key) ? Number(event.key) : null;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => onNudge(-step),
      ArrowDown: () => onNudge(-step),
      ArrowRight: () => onNudge(step),
      ArrowUp: () => onNudge(step),
      PageDown: () => onNudge(-KEYBOARD.bigStep),
      PageUp: () => onNudge(KEYBOARD.bigStep),
      Home: () => onChange(SCALE.min),
      End: () => onChange(SCALE.max),
      Enter: onCommit,
      ' ': onCommit,
    };
    const action = digit === null ? actions[event.key] : () => onChange(digitValue(digit));
    if (!action) return;
    event.preventDefault();
    action();
  };

  const guessAt = percentOf(value);
  const refAt = reveal ? percentOf(reveal.reference) : 0;
  const tier = reveal ? TIER_STYLE[reveal.tier] : null;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 text-sad">
          <Face mood="sad" className="size-7" />
          <span className="hidden sm:inline">難過</span>
        </span>
        <span className="font-display text-base font-semibold text-slate-800 tabular-nums dark:text-slate-100" aria-hidden="true">
          {moodLabel(value)} <span className="text-slate-400 dark:text-slate-500">{formatScore(value)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-happy">
          <span className="hidden sm:inline">開心</span>
          <Face mood="happy" className="size-7" />
        </span>
      </div>

      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="這句話的情緒"
        aria-valuemin={SCALE.min}
        aria-valuemax={SCALE.max}
        aria-valuenow={value}
        aria-valuetext={`${moodLabel(value)}（${formatScore(value)}）`}
        aria-disabled={locked || undefined}
        aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={`relative h-20 touch-none rounded-full outline-offset-8 ${locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <div ref={track} className="absolute inset-x-6 top-1/2 h-3.5 -translate-y-1/2">
          <div className="bg-mood absolute inset-0 rounded-full opacity-90 shadow-[inset_0_1px_3px_rgb(0_0_0/0.25)]" />
          {MOOD_BANDS.slice(0, -1).map((band) => (
            <span
              key={band.upTo}
              className="absolute top-1/2 h-6 w-px -translate-y-1/2 bg-white/60"
              style={{ left: `${percentOf(band.upTo)}%` }}
              aria-hidden="true"
            />
          ))}

          {reveal && tier && (
            <span
              className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${tier.bg} animate-pop`}
              style={{ left: `${Math.min(guessAt, refAt)}%`, width: `${Math.abs(guessAt - refAt)}%` }}
              aria-hidden="true"
            />
          )}

          {/* The net. */}
          <span
            className={`absolute top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 ring-4 ring-white shadow-xl shadow-slate-900/30 backdrop-blur-sm transition-[left] duration-75 dark:ring-white/90 ${locked ? 'animate-cast' : 'hover:scale-105'}`}
            style={{ left: `${guessAt}%` }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 40 40" className="size-full text-white" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.9">
              <clipPath id="net-clip">
                <circle cx="20" cy="20" r="17" />
              </clipPath>
              <g clipPath="url(#net-clip)">
                <path d="M0 8 32 40M0 20 20 40M8 0 40 32M20 0 40 20M0 0 40 40M40 8 8 40M40 20 20 40M32 0 0 32M20 0 0 20M40 0 0 40" />
              </g>
            </svg>
          </span>

          {reveal && tier && (
            <>
              {reveal.tier === 'perfect' && (
                <span
                  className={`absolute top-1/2 size-14 rounded-full ${tier.bg} animate-ripple`}
                  style={{ left: `${refAt}%` }}
                  aria-hidden="true"
                />
              )}
              {keepsCombo(reveal.tier) && (
                <span className="absolute top-1/2 z-20" style={{ left: `${refAt}%` }} aria-hidden="true">
                  {BURST.map((p, i) => (
                    <span
                      key={i}
                      className={`absolute size-2 animate-burst rounded-full ${tier.bg}`}
                      style={{ ['--dx' as string]: p.dx, ['--dy' as string]: p.dy }}
                    />
                  ))}
                </span>
              )}
              <span
                className={`absolute top-1/2 z-10 size-6 animate-drop rounded-full ring-4 ring-white ${tier.bg} shadow-lg dark:ring-slate-950`}
                style={{ left: `${refAt}%` }}
                aria-hidden="true"
              />
              <span
                className="absolute top-full mt-6 -translate-x-1/2 animate-rise whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 font-display text-xs font-semibold text-white tabular-nums shadow dark:bg-white dark:text-slate-900"
                style={{ left: `${refAt}%` }}
              >
                參考 {formatScore(reveal.reference)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
