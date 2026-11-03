import type { Tier } from '../types.ts';

export type Cue = Tier | 'milestone';

interface Note {
  /** Frequency in Hz. */
  freq: number;
  /** Start, in seconds after the cue begins. */
  at: number;
  /** Length in seconds. */
  length: number;
  wave?: OscillatorType;
}

/**
 * Every sound the game makes, as short synthesized notes: no audio files to download or
 * license. Add a cue here and play it with `playCue`.
 */
export const CUES: Record<Cue, Note[]> = {
  perfect: [
    { freq: 784, at: 0, length: 0.12 },
    { freq: 988, at: 0.09, length: 0.12 },
    { freq: 1319, at: 0.18, length: 0.22 },
  ],
  close: [
    { freq: 659, at: 0, length: 0.1 },
    { freq: 880, at: 0.09, length: 0.16 },
  ],
  near: [{ freq: 523, at: 0, length: 0.16, wave: 'triangle' }],
  miss: [
    { freq: 247, at: 0, length: 0.14, wave: 'sawtooth' },
    { freq: 196, at: 0.12, length: 0.22, wave: 'sawtooth' },
  ],
  milestone: [
    { freq: 523, at: 0, length: 0.14 },
    { freq: 659, at: 0.12, length: 0.14 },
    { freq: 784, at: 0.24, length: 0.14 },
    { freq: 1047, at: 0.36, length: 0.4 },
  ],
};

/** Overall loudness (0–1). Kept low: these play often. */
const VOLUME = 0.08;

let context: AudioContext | null = null;

/** The shared AudioContext, created on first use (browsers only allow sound after a click or key press). */
function audio(): AudioContext | null {
  if (context) return context;
  const Ctor = typeof window === 'undefined' ? undefined : window.AudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

export function playCue(cue: Cue): void {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const start = ctx.currentTime;
  for (const note of CUES[cue]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.wave ?? 'sine';
    osc.frequency.value = note.freq;
    const t0 = start + note.at;
    // A quick attack and an exponential fade, so notes don't click.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(VOLUME, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + note.length + 0.02);
  }
}
