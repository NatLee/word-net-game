import { SCALE, SCORING } from '../config.ts';

/**
 * The result card's layout, in SVG units. It is drawn once as SVG: on screen at any width, and
 * as a 4:5 portrait PNG (a shape chat apps and social feeds show whole) when saved.
 */
export const CARD = {
  width: 1080,
  height: 1350,
  /** The emotion map: a square plot, reference score across, the player's answer up. */
  map: { x: 230, y: 470, size: 620 },
  /** Dot radius; at least 8 px across even when the card is shown at half size. */
  dot: 9,
} as const;

const RANGE = SCALE.max - SCALE.min;

/** Where a sentence lands on the map: x from its reference score, y from the guess (up is happier). */
export function mapPoint(reference: number, guess: number): { x: number; y: number } {
  const { x, y, size } = CARD.map;
  return {
    x: x + ((reference - SCALE.min) / RANGE) * size,
    y: y + (1 - (guess - SCALE.min) / RANGE) * size,
  };
}

/**
 * Stroke width of the diagonal band that holds every guess within `distance` of the reference
 * (|guess − reference| ≤ distance). The band's vertical half-height is `distance`, so its
 * perpendicular half-width is distance / √2, in value units, scaled to the map.
 */
export function bandWidth(distance: number): number {
  return ((2 * distance) / Math.SQRT2) * (CARD.map.size / RANGE);
}

/** The two bands drawn on the map: perfect and close, from the scoring rules. */
export const MAP_BANDS = [
  { tier: 'close', width: bandWidth(SCORING.tiers.close) },
  { tier: 'perfect', width: bandWidth(SCORING.tiers.perfect) },
] as const;
