import { SCALE } from '../config.ts';

const RANGE = SCALE.max - SCALE.min;

/** Where a scale value sits along a track, in percent from the left (sad end). */
export const percentOf = (value: number) => ((value - SCALE.min) / RANGE) * 100;

/** The scale value at a point along a track, from 0 (left edge) to 1 (right edge). */
export const valueAt = (fraction: number) => SCALE.min + fraction * RANGE;

/** Number keys 1–9 jump to nine evenly spaced points: 1 = -1, 5 = 0, 9 = +1. */
export const digitValue = (digit: number) => valueAt((digit - 1) / 8);
