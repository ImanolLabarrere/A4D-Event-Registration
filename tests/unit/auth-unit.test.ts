import { describe, it, expect } from "vitest";
import { generateSessionToken } from "../../src/server/auth/token";

// TEST-101 / AC-109: token uniqueness and format
describe("TEST-101 / AC-109: generateSessionToken", () => {
  it("produces a 64-character hexadecimal string", () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
  });

  it("generates 1000 unique tokens", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateSessionToken));
    expect(tokens.size).toBe(1000);
  });
});

// TEST-102 / AC-111: requireRole middleware (pure unit test with mocks)
describe("TEST-102 / AC-111: requireRole middleware", () => {
  // We test the pure logic via the exported helper
  it("calls next() when the user role is in the allowed list", async () => {
    const { requireRoleFn } = await import("../../src/server/auth/middleware");
    const next = { called: false, err: undefined as unknown };
    const fakeNext = (err?: unknown) => {
      next.called = true;
      next.err = err;
    };
    requireRoleFn(["ORGANIZER"], { role: "ORGANIZER" } as any, fakeNext);
    expect(next.called).toBe(true);
    expect(next.err).toBeUndefined();
  });

  it("passes a 403 error when the role is not allowed", async () => {
    const { requireRoleFn } = await import("../../src/server/auth/middleware");
    const next = { called: false, err: undefined as unknown };
    const fakeNext = (err?: unknown) => {
      next.called = true;
      next.err = err;
    };
    requireRoleFn(["ORGANIZER"], { role: "PARTICIPANT" } as any, fakeNext);
    expect(next.called).toBe(true);
    expect((next.err as any)?.status).toBe(403);
  });

  it("passes a 401 error when there is no user", async () => {
    const { requireRoleFn } = await import("../../src/server/auth/middleware");
    const next = { called: false, err: undefined as unknown };
    const fakeNext = (err?: unknown) => {
      next.called = true;
      next.err = err;
    };
    requireRoleFn(["ORGANIZER"], undefined, fakeNext);
    expect(next.called).toBe(true);
    expect((next.err as any)?.status).toBe(401);
  });
});

