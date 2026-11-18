/**
 * Grid & Snap Math Utilities — Ponytail Principle (simple, pure functions)
 */

export type SnapValue = 'bar' | '1' | '1/2' | '1/4' | 'off'

export const SNAP_BEAT_MAP: Record<SnapValue, number> = {
  bar: 4.0,
  '1': 1.0,
  '1/2': 0.5,
  '1/4': 0.25,
  off: 0.0,
}

/**
 * Snap a beat value to the nearest grid step.
 */
export function snapBeat(beat: number, snap: SnapValue): number {
  const step = SNAP_BEAT_MAP[snap]
  if (step <= 0) return Math.max(0, Math.round(beat * 100) / 100)
  return Math.max(0, Math.round(beat / step) * step)
}

/**
 * Convert pixel distance on timeline to beats based on zoom level.
 */
export function pxToBeat(px: number, zoom: number): number {
  return px / Math.max(1, zoom)
}

/**
 * Convert beats to pixels on timeline.
 */
export function beatToPx(beat: number, zoom: number): number {
  return beat * zoom
}
