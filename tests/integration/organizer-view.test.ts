import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../src/server/app";

const prisma = new PrismaClient();

async function loginAs(email: string) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: process.env.SEED_PASSWORD });
  const cookie = (res.headers["set-cookie"] as string[] | undefined)?.[0] ?? "";
  return { cookie, body: res.body };
}

let org1Cookie: string;
let org2Cookie: string;
let partCookie: string;
let org1Id: string;
let org2Id: string;
let part1Id: string;
let part2Id: string;
let part3Id: string;

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();

  const o1 = await loginAs("organizer1@example.test");
  org1Cookie = o1.cookie;
  org1Id = o1.body.id;

  const o2 = await loginAs("organizer2@example.test");
  org2Cookie = o2.cookie;
  org2Id = o2.body.id;

  const p1 = await loginAs("participant1@example.test");
  partCookie = p1.cookie;
  part1Id = p1.body.id;

  const p2 = await prisma.user.findFirstOrThrow({ where: { email: "participant2@example.test" } });
  part2Id = p2.id;
  const p3 = await prisma.user.findFirstOrThrow({ where: { email: "participant3@example.test" } });
  part3Id = p3.id;
});

afterAll(() => prisma.$disconnect());

// ---------------------------------------------------------------------------
// TEST-601 / AC-601 — Owner lists registrations
// ---------------------------------------------------------------------------
describe("TEST-601 / AC-601: owner lists registrations of own event", () => {
  it("returns 200 with all registrations, participant email, ordered by createdAt", async () => {
    const event = await prisma.event.create({
      data: {
        title: "Conférence Tech",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: org1Id,
      },
    });

    // Insert 3 registrations at different times
    const r1 = await prisma.registration.create({
      data: { eventId: event.id, userId: part1Id, createdAt: new Date(Date.now() - 3000) },
    });
    const r2 = await prisma.registration.create({
      data: { eventId: event.id, userId: part2Id, createdAt: new Date(Date.now() - 2000) },
    });
    const r3 = await prisma.registration.create({
      data: { eventId: event.id, userId: part3Id, createdAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set("Cookie", org1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.confirmedCount).toBe(3);
    expect(res.body.event).toMatchObject({ id: event.id, title: "Conférence Tech", capacity: 10 });
    expect(res.body.registrations).toHaveLength(3);
    expect(res.body.registrations[0].id).toBe(r1.id);
    expect(res.body.registrations[1].id).toBe(r2.id);
    expect(res.body.registrations[2].id).toBe(r3.id);
    expect(res.body.registrations[0].participant.email).toBe("participant1@example.test");
  });
});

// ---------------------------------------------------------------------------
// TEST-602 / AC-602 — Event with no registration
// ---------------------------------------------------------------------------
describe("TEST-602 / AC-602: empty registrations", () => {
  it("returns 200 with empty registrations and confirmedCount 0", async () => {
    const event = await prisma.event.create({
      data: {
        title: "Nouvel atelier",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 5,
        status: "DRAFT",
        organizerId: org1Id,
      },
    });

    const res = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set("Cookie", org1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.confirmedCount).toBe(0);
    expect(res.body.registrations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TEST-603 / AC-603 — Another organizer gets 404 (BR-07)
// ---------------------------------------------------------------------------
describe("TEST-603 / AC-603: other organizer gets 404", () => {
  it("returns 404 and no participant email when requesting another organizer's event", async () => {
    const event = await prisma.event.create({
      data: {
        title: "Événement secret org1",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: org1Id,
      },
    });
    await prisma.registration.create({ data: { eventId: event.id, userId: part1Id } });

    const res = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set("Cookie", org2Cookie);

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("participant1@example.test");
  });
});

// ---------------------------------------------------------------------------
// TEST-604 / AC-604 — Participant gets 403
// ---------------------------------------------------------------------------
describe("TEST-604 / AC-604: participant gets 403", () => {
  it("returns 403 for participant callers", async () => {
    const event = await prisma.event.create({
      data: {
        title: "Événement public",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: org1Id,
      },
    });

    const res = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set("Cookie", partCookie);

    expect(res.status).toBe(403);
    expect(res.body?.error?.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// TEST-605 / AC-605 — Anonymous gets 401
// ---------------------------------------------------------------------------
describe("TEST-605 / AC-605: anonymous gets 401", () => {
  it("returns 401 when unauthenticated", async () => {
    const event = await prisma.event.create({
      data: {
        title: "Événement",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: org1Id,
      },
    });

    const res = await request(app).get(`/api/events/${event.id}/registrations`);
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("UNAUTHENTICATED");
  });
});

// ---------------------------------------------------------------------------
// TEST-606 / AC-606 — Unknown or malformed id returns 404
// ---------------------------------------------------------------------------
describe("TEST-606 / AC-606: unknown or malformed id", () => {
  it("returns 404 for nonexistent UUID and for 'abc'", async () => {
    const r1 = await request(app)
      .get("/api/events/00000000-0000-0000-0000-000000000000/registrations")
      .set("Cookie", org1Cookie);
    const r2 = await request(app)
      .get("/api/events/abc/registrations")
      .set("Cookie", org1Cookie);

    expect(r1.status).toBe(404);
    expect(r2.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// TEST-607 / AC-607 — Isolation between events of same organizer
// ---------------------------------------------------------------------------
describe("TEST-607 / AC-607: registration isolation between events", () => {
  it("returns only registrations of the requested event", async () => {
    const ev1 = await prisma.event.create({
      data: { title: "E1", startsAt: new Date(Date.now() + 86400000), capacity: 10, organizerId: org1Id },
    });
    const ev2 = await prisma.event.create({
      data: { title: "E2", startsAt: new Date(Date.now() + 86400000), capacity: 10, organizerId: org1Id },
    });

    await prisma.registration.create({ data: { eventId: ev1.id, userId: part1Id } });
    await prisma.registration.create({ data: { eventId: ev2.id, userId: part2Id } });

    const res1 = await request(app).get(`/api/events/${ev1.id}/registrations`).set("Cookie", org1Cookie);
    expect(res1.body.registrations).toHaveLength(1);
    expect(res1.body.registrations[0].participant.id).toBe(part1Id);

    const res2 = await request(app).get(`/api/events/${ev2.id}/registrations`).set("Cookie", org1Cookie);
    expect(res2.body.registrations).toHaveLength(1);
    expect(res2.body.registrations[0].participant.id).toBe(part2Id);
  });
});

// ---------------------------------------------------------------------------
// TEST-608 / AC-608 — Participant data privacy
// ---------------------------------------------------------------------------
describe("TEST-608 / AC-608: no extra private fields on participant", () => {
  it("exposes only id and email on participant; no passwordHash, role, session", async () => {
    const event = await prisma.event.create({
      data: { title: "Event", startsAt: new Date(Date.now() + 86400000), capacity: 10, organizerId: org1Id },
    });
    await prisma.registration.create({ data: { eventId: event.id, userId: part1Id } });

    const res = await request(app).get(`/api/events/${event.id}/registrations`).set("Cookie", org1Cookie);
    expect(res.status).toBe(200);
    const participant = res.body.registrations[0].participant;
    expect(Object.keys(participant).sort()).toEqual(["email", "id"]);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});
