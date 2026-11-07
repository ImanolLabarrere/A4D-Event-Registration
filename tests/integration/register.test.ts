import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server/app";

const prisma = new PrismaClient();
const DAY = 24 * 3600 * 1000;
const tag = (n: string) => `${n}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function loginAs(email: string) {
  const res = await request(app).post("/api/auth/login")
    .send({ email, password: process.env.SEED_PASSWORD });
  const cookie = (res.headers["set-cookie"] as string[] | undefined)?.[0] ?? "";
  return { cookie, body: res.body };
}

const register = (eventId: string, cookie?: string) => {
  const r = request(app).post(`/api/events/${eventId}/registrations`);
  return cookie ? r.set("Cookie", cookie) : r;
};

const eventIds: string[] = [];
const userIds: string[] = [];
let passwordHash: string;
let org1: { cookie: string; id: string };
let part1: { cookie: string; id: string };

async function insertEvent(o: { capacity?: number; startsAt?: Date; status?: "DRAFT" | "PUBLISHED" } = {}) {
  const ev = await prisma.event.create({
    data: {
      title: tag("t4xx"),
      startsAt: o.startsAt ?? new Date(Date.now() + 14 * DAY),
      capacity: o.capacity ?? 5,
      status: o.status ?? "PUBLISHED",
      organizerId: org1.id,
    },
  });
  eventIds.push(ev.id);
  return ev;
}

async function makeParticipants(n: number) {
  const users = [];
  for (let i = 0; i < n; i++) {
    const u = await prisma.user.create({
      data: { email: `${tag("p")}@example.test`, passwordHash, role: "PARTICIPANT" },
    });
    userIds.push(u.id);
    users.push(u);
  }
  return users;
}

beforeAll(async () => {
  passwordHash = await argon2.hash(process.env.SEED_PASSWORD!);
  const o = await loginAs("organizer1@example.test");
  const p = await loginAs("participant1@example.test");
  org1 = { cookie: o.cookie, id: o.body.id };
  part1 = { cookie: p.cookie, id: p.body.id };
});

afterAll(async () => {
  await prisma.registration.deleteMany({ where: { OR: [{ eventId: { in: eventIds } }, { userId: { in: userIds } }] } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("TEST-402 / AC-401: participant registers for a published future event", () => {
  it("returns 201 CONFIRMED and stores the registration for the caller", async () => {
    const ev = await insertEvent();
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("CONFIRMED");
    expect(res.body.eventId).toBe(ev.id);
    const row = await prisma.registration.findFirst({ where: { eventId: ev.id, userId: part1.id } });
    expect(row?.status).toBe("CONFIRMED");
  });
});

describe("TEST-403 / AC-412: boundary, N-1 of N places taken", () => {
  it("accepts the last participant and the confirmed count reaches capacity", async () => {
    const ev = await insertEvent({ capacity: 3 });
    const [a, b] = await makeParticipants(2);
    await prisma.registration.createMany({ data: [a, b].map((u) => ({ eventId: ev.id, userId: u.id, status: "CONFIRMED" as const })) });
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(201);
    expect(await prisma.registration.count({ where: { eventId: ev.id, status: "CONFIRMED" } })).toBe(3);
  });
});

describe("TEST-404 / AC-402: event at capacity (BR-04)", () => {
  it("returns 409 EVENT_FULL and stores no extra row", async () => {
    const ev = await insertEvent({ capacity: 1 });
    const [a] = await makeParticipants(1);
    await prisma.registration.create({ data: { eventId: ev.id, userId: a.id, status: "CONFIRMED" } });
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EVENT_FULL");
    expect(await prisma.registration.count({ where: { eventId: ev.id } })).toBe(1);
  });
});

describe("TEST-405 / AC-403: same participant registers twice (BR-03)", () => {
  it("returns 409 ALREADY_REGISTERED and keeps one row", async () => {
    const ev = await insertEvent();
    expect((await register(ev.id, part1.cookie)).status).toBe(201);
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ALREADY_REGISTERED");
    expect(await prisma.registration.count({ where: { eventId: ev.id, userId: part1.id } })).toBe(1);
  });
});

describe("TEST-406 / AC-404: past event (BR-05)", () => {
  it("returns 409 EVENT_IN_PAST and stores nothing", async () => {
    const ev = await insertEvent({ startsAt: new Date(Date.now() - 2 * DAY) });
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EVENT_IN_PAST");
    expect(await prisma.registration.count({ where: { eventId: ev.id } })).toBe(0);
  });
});

describe("TEST-407 / AC-405: draft event is invisible (BR-06)", () => {
  it("returns 404 and stores nothing", async () => {
    const ev = await insertEvent({ status: "DRAFT" });
    const res = await register(ev.id, part1.cookie);
    expect(res.status).toBe(404);
    expect(await prisma.registration.count({ where: { eventId: ev.id } })).toBe(0);
  });
});

describe("TEST-408 / AC-406: unknown or malformed id", () => {
  it("returns 404 for a random UUID and for 'abc'", async () => {
    expect((await register(randomUUID(), part1.cookie)).status).toBe(404);
    expect((await register("abc", part1.cookie)).status).toBe(404);
  });
});

describe("TEST-409 / AC-407: organizer cannot register", () => {
  it("returns 403 and stores nothing", async () => {
    const ev = await insertEvent();
    const res = await register(ev.id, org1.cookie);
    expect(res.status).toBe(403);
    expect(await prisma.registration.count({ where: { eventId: ev.id } })).toBe(0);
  });
});

describe("TEST-410 / AC-408: anonymous cannot register", () => {
  it("returns 401 without private data", async () => {
    const ev = await insertEvent();
    const res = await register(ev.id);
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(ev.title);
    expect(await prisma.registration.count({ where: { eventId: ev.id } })).toBe(0);
  });
});

describe("TEST-411 / AC-409 / NFR-03: 20 simultaneous requests for the last place", () => {
  it("exactly one 201, nineteen 409 EVENT_FULL, confirmed count equals capacity", async () => {
    const ev = await insertEvent({ capacity: 5 });
    const users = await makeParticipants(24);
    const pre = users.slice(0, 4);
    const contenders = users.slice(4);
    await prisma.registration.createMany({ data: pre.map((u) => ({ eventId: ev.id, userId: u.id, status: "CONFIRMED" as const })) });
    const cookies: string[] = [];
    for (const u of contenders) cookies.push((await loginAs(u.email)).cookie);

    const results = await Promise.all(cookies.map((c) => register(ev.id, c)));

    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    const full = results.filter((r) => r.status === 409);
    expect(full).toHaveLength(19);
    expect(full.every((r) => r.body.error.code === "EVENT_FULL")).toBe(true);
    expect(await prisma.registration.count({ where: { eventId: ev.id, status: "CONFIRMED" } })).toBe(5);
  }, 30000);
});

describe("TEST-412 / AC-410: 5 simultaneous requests from the same participant", () => {
  it("exactly one 201, four 409 ALREADY_REGISTERED, one row", async () => {
    const ev = await insertEvent({ capacity: 5 });
    const [u] = await makeParticipants(1);
    const { cookie } = await loginAs(u.email);
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => register(ev.id, cookie)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    const dup = results.filter((r) => r.status === 409);
    expect(dup).toHaveLength(4);
    expect(dup.every((r) => r.body.error.code === "ALREADY_REGISTERED")).toBe(true);
    expect(await prisma.registration.count({ where: { eventId: ev.id, userId: u.id } })).toBe(1);
  }, 30000);
});

describe("TEST-413 / AC-411: the database itself rejects a duplicate registration", () => {
  it("raises a UNIQUE violation on a second row for the same (event, user)", async () => {
    const ev = await insertEvent();
    await prisma.registration.create({ data: { eventId: ev.id, userId: part1.id, status: "CONFIRMED" } });
    await expect(
      prisma.registration.create({ data: { eventId: ev.id, userId: part1.id, status: "CONFIRMED" } }),
    ).rejects.toThrow();
  });
});
