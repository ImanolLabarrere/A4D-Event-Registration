import { describe, it, expect } from "vitest";
import { computeRemainingPlaces } from "../../src/server/events/browse";

// TEST-301 / AC-309: remaining places calculation
describe("TEST-301 / AC-309: computeRemainingPlaces", () => {
  it.each([
    [5, 0, 5],
    [5, 5, 0],
    [5, 6, 0], // over capacity: clamp to 0
    [1, 0, 1],
    [10, 3, 7],
  ])("capacity=%i, confirmed=%i → remainingPlaces=%i", (capacity, confirmed, expected) => {
    expect(computeRemainingPlaces(capacity, confirmed)).toBe(expected);
  });
});

