import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server/app";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function loginAs(email: string) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: process.env.SEED_PASSWORD });
  const cookie = (res.headers["set-cookie"] as string[] | undefined)?.[0] ?? "";
  return { cookie, body: res.body };
}

/** Insert events directly — does not depend on F-02 API. */
async function insertEvent(
  organizerId: string,
  overrides: Partial<{ title: string; startsAt: Date; capacity: number; status: "DRAFT" | "PUBLISHED" }> = {},
) {
  return prisma.event.create({
    data: {
      title: "Test event",
      startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 1 week ahead
      capacity: 10,
      status: "PUBLISHED",
      organizerId,
      ...overrides,
    },
  });
}

/** Insert a confirmed registration directly in the DB. */
async function insertReg(eventId: string, userId: string) {
  return prisma.registration.create({
    data: { eventId, userId, status: "CONFIRMED" },
  });
}

let participantCookie: string;
let organizer1Cookie: string;
let organizer2Cookie: string;
let participantId: string;
let organizer1Id: string;
let organizer2Id: string;

beforeEach(async () => {
  // Clean events and registrations between tests (users stay from seed)
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();

  const p = await loginAs("participant1@example.test");
  participantCookie = p.cookie;
  participantId = p.body.id;

  const o1 = await loginAs("organizer1@example.test");
  organizer1Cookie = o1.cookie;
  organizer1Id = o1.body.id;

  const o2 = await loginAs("organizer2@example.test");
  organizer2Cookie = o2.cookie;
  organizer2Id = o2.body.id;
});

afterAll(() => prisma.$disconnect());

// ---------------------------------------------------------------------------
// TEST-302 / AC-301, AC-302, AC-312 — only future published events in the list
// ---------------------------------------------------------------------------
describe("TEST-302 / AC-301, AC-302, AC-312: event list filtering", () => {
  it("returns only future published events", async () => {
    const future = await insertEvent(organizer1Id, { title: "Future published" });
    await insertEvent(organizer1Id, { title: "Draft", status: "DRAFT" });
    await insertEvent(organizer1Id, {
      title: "Past published",
      startsAt: new Date(Date.now() - 86400000),
    });

    const res = await request(app).get("/api/events").set("Cookie", participantCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(future.id);
  });
});

// ---------------------------------------------------------------------------
// TEST-303 / AC-301 — events ordered by startsAt ascending
// ---------------------------------------------------------------------------
describe("TEST-303 / AC-301: ordering by date ascending", () => {
  it("returns events ordered by startsAt ascending", async () => {
    const now = Date.now();
    await insertEvent(organizer1Id, { title: "C", startsAt: new Date(now + 3 * 86400000) });
    await insertEvent(organizer1Id, { title: "A", startsAt: new Date(now + 1 * 86400000) });
    await insertEvent(organizer1Id, { title: "B", startsAt: new Date(now + 2 * 86400000) });

    const res = await request(app).get("/api/events").set("Cookie", participantCookie);
    expect(res.status).toBe(200);
    expect(res.body.map((e: any) => e.title)).toEqual(["A", "B", "C"]);
  });
});

// ---------------------------------------------------------------------------
// TEST-304 / AC-310 — empty list when no published events
// ---------------------------------------------------------------------------
describe("TEST-304 / AC-310: empty list", () => {
  it("returns 200 and an empty array when no future published events exist", async () => {
    const res = await request(app).get("/api/events").set("Cookie", participantCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TEST-305 / AC-303 — participant cannot open a draft by id
// ---------------------------------------------------------------------------
describe("TEST-305 / AC-303: participant cannot open draft by id", () => {
  it("returns 404 and no title for a draft", async () => {
    const draft = await insertEvent(organizer1Id, { status: "DRAFT" });
    const res = await request(app).get(`/api/events/${draft.id}`).set("Cookie", participantCookie);
    expect(res.status).toBe(404);
    expect(res.body?.title).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(draft.title);
  });
});

// ---------------------------------------------------------------------------
// TEST-306 / AC-304, AC-305 — organizer draft visibility
// ---------------------------------------------------------------------------
describe("TEST-306 / AC-304, AC-305: organizer draft visibility", () => {
  it("org2 gets 404 for org1 draft; org1 gets 200 for own draft", async () => {
    const draft = await insertEvent(organizer1Id, { status: "DRAFT", title: "Secret draft" });

    const res1 = await request(app).get(`/api/events/${draft.id}`).set("Cookie", organizer2Cookie);
    expect(res1.status).toBe(404);
    expect(JSON.stringify(res1.body)).not.toContain("Secret draft");

    const res2 = await request(app).get(`/api/events/${draft.id}`).set("Cookie", organizer1Cookie);
    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(draft.id);
  });
});

// ---------------------------------------------------------------------------
// TEST-307 / AC-306 — anonymous access rejected
// ---------------------------------------------------------------------------
describe("TEST-307 / AC-306: anonymous access rejected", () => {
  it("returns 401 for all three endpoints without a cookie", async () => {
    const ev = await insertEvent(organizer1Id);
    const list = await request(app).get("/api/events");
    const mine = await request(app).get("/api/events/mine");
    const detail = await request(app).get(`/api/events/${ev.id}`);
    expect(list.status).toBe(401);
    expect(mine.status).toBe(401);
    expect(detail.status).toBe(401);
    expect(JSON.stringify(list.body)).not.toMatch(/title|email|passwordHash/);
  });
});

// ---------------------------------------------------------------------------
// TEST-308 / AC-307 — organizer /mine isolation
// ---------------------------------------------------------------------------
describe("TEST-308 / AC-307: organizer sees only own events on /mine", () => {
  it("returns both draft and published owned events, none of the other organizer's", async () => {
    await insertEvent(organizer1Id, { title: "O1 published", status: "PUBLISHED" });
    await insertEvent(organizer1Id, { title: "O1 draft", status: "DRAFT" });
    await insertEvent(organizer2Id, { title: "O2 event", status: "PUBLISHED" });

    const res = await request(app).get("/api/events/mine").set("Cookie", organizer1Cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach((e: any) => expect(e.title).toMatch(/^O1/));
  });
});

// ---------------------------------------------------------------------------
// TEST-309 / AC-308 — participant cannot call /mine
// ---------------------------------------------------------------------------
describe("TEST-309 / AC-308: participant cannot call /mine", () => {
  it("returns 403", async () => {
    const res = await request(app).get("/api/events/mine").set("Cookie", participantCookie);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// TEST-310 / AC-309 — confirmedCount and remainingPlaces
// ---------------------------------------------------------------------------
describe("TEST-310 / AC-309: confirmedCount and remainingPlaces", () => {
  it("reflects the number of confirmed registrations", async () => {
    const participant2 = await prisma.user.findFirstOrThrow({
      where: { email: "participant2@example.test" },
    });
    const ev = await insertEvent(organizer1Id, { capacity: 2 });

    const res1 = await request(app).get(`/api/events/${ev.id}`).set("Cookie", participantCookie);
    expect(res1.body.confirmedCount).toBe(0);
    expect(res1.body.remainingPlaces).toBe(2);

    await insertReg(ev.id, participantId);
    const res2 = await request(app).get(`/api/events/${ev.id}`).set("Cookie", participantCookie);
    expect(res2.body.confirmedCount).toBe(1);
    expect(res2.body.remainingPlaces).toBe(1);

    await insertReg(ev.id, participant2.id);
    const res3 = await request(app).get(`/api/events/${ev.id}`).set("Cookie", participantCookie);
    expect(res3.body.confirmedCount).toBe(2);
    expect(res3.body.remainingPlaces).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TEST-311 / AC-311 — unknown or malformed id returns 404
// ---------------------------------------------------------------------------
describe("TEST-311 / AC-311: unknown or malformed event id", () => {
  it("returns 404 for a random UUID and for 'abc'", async () => {
    const r1 = await request(app)
      .get("/api/events/00000000-0000-0000-0000-000000000000")
      .set("Cookie", participantCookie);
    const r2 = await request(app).get("/api/events/abc").set("Cookie", participantCookie);
    expect(r1.status).toBe(404);
    expect(r2.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// TEST-312 / AC-312 — past published event: not in list, but accessible by id
// ---------------------------------------------------------------------------
describe("TEST-312 / AC-312: past published event", () => {
  it("not in list, but 200 when fetched by id", async () => {
    const past = await insertEvent(organizer1Id, {
      title: "Past event",
      startsAt: new Date(Date.now() - 86400000),
    });

    const list = await request(app).get("/api/events").set("Cookie", participantCookie);
    expect(list.body.find((e: any) => e.id === past.id)).toBeUndefined();

    const detail = await request(app).get(`/api/events/${past.id}`).set("Cookie", participantCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.id).toBe(past.id);
  });
});

// ---------------------------------------------------------------------------
// TEST-313 / AC-313 — no private data in responses
// ---------------------------------------------------------------------------
describe("TEST-313 / AC-313: no private data in responses", () => {
  it("event list and detail contain no email, passwordHash, userId, organizerId or registrations", async () => {
    const ev = await insertEvent(organizer1Id);
    await insertReg(ev.id, participantId);

    const list = await request(app).get("/api/events").set("Cookie", participantCookie);
    const detail = await request(app).get(`/api/events/${ev.id}`).set("Cookie", participantCookie);

    for (const body of [JSON.stringify(list.body), JSON.stringify(detail.body)]) {
      expect(body).not.toContain("passwordHash");
      expect(body).not.toContain("organizerId");
      expect(body).not.toContain('"registrations"');
    }
  });
});

