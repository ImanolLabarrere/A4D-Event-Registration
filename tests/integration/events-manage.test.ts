import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
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

const DAY = 24 * 3600 * 1000;
const future = () => new Date(Date.now() + 14 * DAY).toISOString();
const past = () => new Date(Date.now() - 2 * DAY);
const tag = (n: string) => `${n}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createdIds: string[] = [];
let org1: { cookie: string; id: string };
let org2: { cookie: string; id: string };
let part: { cookie: string; id: string };

/** Insert an event directly (independent of the API under test). */
async function insertEvent(organizerId: string, o: { startsAt?: Date; status?: "DRAFT" | "PUBLISHED" } = {}) {
  const ev = await prisma.event.create({
    data: {
      title: tag("t2xx"),
      startsAt: o.startsAt ?? new Date(Date.now() + 14 * DAY),
      capacity: 5,
      status: o.status ?? "DRAFT",
      organizerId,
    },
  });
  createdIds.push(ev.id);
  return ev;
}

beforeAll(async () => {
  const o1 = await loginAs("organizer1@example.test");
  const o2 = await loginAs("organizer2@example.test");
  const p = await loginAs("participant1@example.test");
  org1 = { cookie: o1.cookie, id: o1.body.id };
  org2 = { cookie: o2.cookie, id: o2.body.id };
  part = { cookie: p.cookie, id: p.body.id };
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

describe("TEST-203 / AC-201: organizer creates a draft event", () => {
  it("returns 201, DRAFT, owned by the caller, and the row is persisted", async () => {
    const title = tag("t203");
    const res = await request(app).post("/api/events").set("Cookie", org1.cookie)
      .send({ title, startsAt: future(), capacity: 5 });
    expect(res.status).toBe(201);
    createdIds.push(res.body.id);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.organizerId).toBe(org1.id);
    const row = await prisma.event.findUnique({ where: { id: res.body.id } });
    expect(row?.title).toBe(title);
    expect(row?.organizerId).toBe(org1.id);
    expect(row?.status).toBe("DRAFT");
  });
});

describe("TEST-204 / AC-202: invalid capacity", () => {
  it.each([0, -1, 1.5, "10", null])("returns 400 and stores nothing for capacity %s", async (capacity) => {
    const title = tag("t204");
    const res = await request(app).post("/api/events").set("Cookie", org1.cookie)
      .send({ title, startsAt: future(), capacity });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(await prisma.event.count({ where: { title } })).toBe(0);
  });
});

describe("TEST-205 / AC-203: invalid title or date", () => {
  it("returns 400 for an empty title and for an invalid date", async () => {
    const a = await request(app).post("/api/events").set("Cookie", org1.cookie)
      .send({ title: "   ", startsAt: future(), capacity: 5 });
    const b = await request(app).post("/api/events").set("Cookie", org1.cookie)
      .send({ title: tag("t205"), startsAt: "not-a-date", capacity: 5 });
    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
  });
});

describe("TEST-206 / AC-204: participant cannot create an event", () => {
  it("returns 403 and stores nothing", async () => {
    const title = tag("t206");
    const res = await request(app).post("/api/events").set("Cookie", part.cookie)
      .send({ title, startsAt: future(), capacity: 5 });
    expect(res.status).toBe(403);
    expect(await prisma.event.count({ where: { title } })).toBe(0);
  });
});

describe("TEST-207 / AC-205: anonymous cannot create an event", () => {
  it("returns 401 without private data", async () => {
    const title = tag("t207");
    const res = await request(app).post("/api/events")
      .send({ title, startsAt: future(), capacity: 5 });
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(title);
    expect(await prisma.event.count({ where: { title } })).toBe(0);
  });
});

describe("TEST-208 / AC-206: owner publishes a draft with a future date", () => {
  it("returns 200, PUBLISHED, persisted", async () => {
    const ev = await insertEvent(org1.id);
    const res = await request(app).post(`/api/events/${ev.id}/publish`).set("Cookie", org1.cookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
    expect((await prisma.event.findUnique({ where: { id: ev.id } }))?.status).toBe("PUBLISHED");
  });
});

describe("TEST-209 / AC-207: publishing an event whose date has passed", () => {
  it("returns 409 EVENT_IN_PAST and the event stays DRAFT", async () => {
    const ev = await insertEvent(org1.id, { startsAt: past() });
    const res = await request(app).post(`/api/events/${ev.id}/publish`).set("Cookie", org1.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EVENT_IN_PAST");
    expect((await prisma.event.findUnique({ where: { id: ev.id } }))?.status).toBe("DRAFT");
  });
});

describe("TEST-210 / AC-208: publishing an already published event", () => {
  it("returns 409 ALREADY_PUBLISHED", async () => {
    const ev = await insertEvent(org1.id, { status: "PUBLISHED" });
    const res = await request(app).post(`/api/events/${ev.id}/publish`).set("Cookie", org1.cookie);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ALREADY_PUBLISHED");
  });
});

describe("TEST-211 / AC-209: another organizer's event (ownership, BR-07)", () => {
  it("returns 404 and leaves the event DRAFT", async () => {
    const ev = await insertEvent(org2.id);
    const res = await request(app).post(`/api/events/${ev.id}/publish`).set("Cookie", org1.cookie);
    expect(res.status).toBe(404);
    expect((await prisma.event.findUnique({ where: { id: ev.id } }))?.status).toBe("DRAFT");
  });
});

describe("TEST-212 / AC-210: participant cannot publish", () => {
  it("returns 403 and leaves the event DRAFT", async () => {
    const ev = await insertEvent(org1.id);
    const res = await request(app).post(`/api/events/${ev.id}/publish`).set("Cookie", part.cookie);
    expect(res.status).toBe(403);
    expect((await prisma.event.findUnique({ where: { id: ev.id } }))?.status).toBe("DRAFT");
  });
});

describe("TEST-213 / AC-211: unknown or malformed id", () => {
  it("returns 404 for a random UUID and for 'abc'", async () => {
    const a = await request(app).post(`/api/events/${randomUUID()}/publish`).set("Cookie", org1.cookie);
    const b = await request(app).post("/api/events/abc/publish").set("Cookie", org1.cookie);
    expect(a.status).toBe(404);
    expect(b.status).toBe(404);
  });
});

describe("TEST-215 / AC-213: server-owned fields in the body are ignored", () => {
  it("creates a DRAFT owned by the caller even if organizerId and status are sent", async () => {
    const res = await request(app).post("/api/events").set("Cookie", org1.cookie)
      .send({ title: tag("t215"), startsAt: future(), capacity: 5, organizerId: org2.id, status: "PUBLISHED" });
    expect(res.status).toBe(201);
    createdIds.push(res.body.id);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.organizerId).toBe(org1.id);
  });
});

