/**
 * F-03: Browse events helpers.
 * Pure functions — testable without HTTP or DB.
 */

/**
 * Computes the remaining places for an event.
 * remainingPlaces = max(0, capacity - confirmedCount)
 */
export function computeRemainingPlaces(capacity: number, confirmedCount: number): number {
  return Math.max(0, capacity - confirmedCount);
}

