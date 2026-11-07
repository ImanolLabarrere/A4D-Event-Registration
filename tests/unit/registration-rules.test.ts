import { describe, it, expect } from "vitest";
import { decideRegistration } from "../../src/server/registrations/rules";

const now = new Date("2026-11-08T10:00:00Z");
const future = new Date("2026-12-01T10:00:00Z");
const past = new Date("2026-11-01T10:00:00Z");
const open = { capacity: 3, confirmedCount: 0, startsAt: future, now, alreadyRegistered: false };

describe("TEST-401 / AC-402, 403, 404, 412: registration decision (BR-03, BR-04, BR-05)", () => {
  it("accepts when N-1 of N places are taken (boundary)", () => {
    expect(decideRegistration({ ...open, confirmedCount: 2 })).toBe("OK");
  });
  it("returns FULL when the event is at capacity", () => {
    expect(decideRegistration({ ...open, confirmedCount: 3 })).toBe("FULL");
  });
  it("returns DUPLICATE when the participant is already registered", () => {
    expect(decideRegistration({ ...open, alreadyRegistered: true })).toBe("DUPLICATE");
  });
  it("returns PAST when the event date is not in the future", () => {
    expect(decideRegistration({ ...open, startsAt: past })).toBe("PAST");
    expect(decideRegistration({ ...open, startsAt: now })).toBe("PAST");
  });
  it("applies precedence PAST > DUPLICATE > FULL", () => {
    const all = { ...open, confirmedCount: 3, alreadyRegistered: true, startsAt: past };
    expect(decideRegistration(all)).toBe("PAST");
    expect(decideRegistration({ ...all, startsAt: future })).toBe("DUPLICATE");
  });
});
