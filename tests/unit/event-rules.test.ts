import { describe, it, expect } from "vitest";
import { createEventSchema, canPublish } from "../../src/server/events/rules";

const base = { title: "Workshop", startsAt: "2027-01-01T10:00:00Z" };

describe("TEST-201 / AC-202: capacity validation (BR-01)", () => {
  it.each([0, -1, 1.5, "10", undefined, 10001])("rejects capacity %s", (capacity) => {
    expect(createEventSchema.safeParse({ ...base, capacity }).success).toBe(false);
  });
  it.each([1, 10000])("accepts capacity %s", (capacity) => {
    expect(createEventSchema.safeParse({ ...base, capacity }).success).toBe(true);
  });
  it("rejects an empty title and an invalid date (AC-203)", () => {
    expect(createEventSchema.safeParse({ ...base, title: "  ", capacity: 5 }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, startsAt: "not-a-date", capacity: 5 }).success).toBe(false);
  });
});

describe("TEST-202 / AC-207: publication date rule (BR-02)", () => {
  const startsAt = new Date("2027-01-01T10:00:00Z");
  it("refuses when now equals or is after startsAt", () => {
    expect(canPublish({ startsAt }, startsAt)).toBe(false);
    expect(canPublish({ startsAt }, new Date("2027-01-02T00:00:00Z"))).toBe(false);
  });
  it("accepts when now is one second before startsAt", () => {
    expect(canPublish({ startsAt }, new Date("2027-01-01T09:59:59Z"))).toBe(true);
  });
});
