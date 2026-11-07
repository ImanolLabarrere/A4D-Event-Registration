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

let part1Cookie: string;
let part2Cookie: string;
let orgCookie: string;
let part1Id: string;
let part2Id: string;
let orgId: string;

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();

  const p1 = await loginAs("participant1@example.test");
  part1Cookie = p1.cookie;
  part1Id = p1.body.id;

  const p2 = await loginAs("participant2@example.test");
  part2Cookie = p2.cookie;
  part2Id = p2.body.id;

  const o = await loginAs("organizer1@example.test");
  orgCookie = o.cookie;
  orgId = o.body.id;
});

afterAll(() => prisma.$disconnect());

// ---------------------------------------------------------------------------
// TEST-501 / AC-501: Two participants each have registrations
// ---------------------------------------------------------------------------
describe("TEST-501 / AC-501: participant sees only own registrations", () => {
  it("P1 has 2 registrations, P2 has 1 -> P1 sees 2 own, P2 sees 1 own", async () => {
    const ev1 = await prisma.event.create({
      data: {
        title: "Atelier TypeScript",
        startsAt: new Date(Date.now() + 5 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: orgId,
      },
    });
    const ev2 = await prisma.event.create({
      data: {
        title: "Conférence IA",
        startsAt: new Date(Date.now() + 10 * 86400000),
        capacity: 20,
        status: "PUBLISHED",
        organizerId: orgId,
      },
    });

    // P1 registers for ev1 and ev2
    const r1 = await prisma.registration.create({
      data: { eventId: ev1.id, userId: part1Id, createdAt: new Date(Date.now() - 2000) },
    });
    const r2 = await prisma.registration.create({
      data: { eventId: ev2.id, userId: part1Id, createdAt: new Date(Date.now() - 1000) },
    });
    // P2 registers for ev1 only
    const r3 = await prisma.registration.create({
      data: { eventId: ev1.id, userId: part2Id, createdAt: new Date(Date.now() - 500) },
    });

    const resP1 = await request(app).get("/api/registrations").set("Cookie", part1Cookie);
    expect(resP1.status).toBe(200);
    expect(resP1.body).toHaveLength(2);
    // Newest first
    expect(resP1.body[0].id).toBe(r2.id);
    expect(resP1.body[1].id).toBe(r1.id);
    expect(resP1.body[0].eventTitle).toBe("Conférence IA");

    const resP2 = await request(app).get("/api/registrations").set("Cookie", part2Cookie);
    expect(resP2.status).toBe(200);
    expect(resP2.body).toHaveLength(1);
    expect(resP2.body[0].id).toBe(r3.id);
    expect(resP2.body[0].eventTitle).toBe("Atelier TypeScript");
  });
});

// ---------------------------------------------------------------------------
// TEST-502 / AC-502: Participant with no registration
// ---------------------------------------------------------------------------
describe("TEST-502 / AC-502: participant without registration", () => {
  it("returns 200 with an empty array", async () => {
    const res = await request(app).get("/api/registrations").set("Cookie", part1Cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TEST-503 / AC-503: Participant opens their own registration after registering
// ---------------------------------------------------------------------------
describe("TEST-503 / AC-503: open own registration by id", () => {
  it("returns 200 with stored registration data", async () => {
    const ev = await prisma.event.create({
      data: {
        title: "Séminaire Sécurité",
        startsAt: new Date(Date.now() + 7 * 86400000),
        capacity: 15,
        status: "PUBLISHED",
        organizerId: orgId,
      },
    });

    const reg = await prisma.registration.create({
      data: { eventId: ev.id, userId: part1Id },
    });

    const res = await request(app).get(`/api/registrations/${reg.id}`).set("Cookie", part1Cookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: reg.id,
      eventId: ev.id,
      eventTitle: "Séminaire Sécurité",
      status: "CONFIRMED",
    });
    expect(new Date(res.body.eventStartsAt).toISOString()).toBe(ev.startsAt.toISOString());
    expect(res.body.createdAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// TEST-504 / AC-504: Participant opens another participant's registration id
// ---------------------------------------------------------------------------
describe("TEST-504 / AC-504: participant opens another participant's registration", () => {
  it("returns 404 with no registration or event data (BR-09)", async () => {
    const ev = await prisma.event.create({
      data: {
        title: "Conférence Cloud",
        startsAt: new Date(Date.now() + 7 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: orgId,
      },
    });

    const regP2 = await prisma.registration.create({
      data: { eventId: ev.id, userId: part2Id },
    });

    const res = await request(app).get(`/api/registrations/${regP2.id}`).set("Cookie", part1Cookie);
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe("NOT_FOUND");
    expect(JSON.stringify(res.body)).not.toContain("Conférence Cloud");
  });
});

// ---------------------------------------------------------------------------
// TEST-505 / AC-505: Participant opens a non-existent id
// ---------------------------------------------------------------------------
describe("TEST-505 / AC-505: nonexistent or malformed registration id", () => {
  it("returns 404 with body identical to AC-504", async () => {
    const res = await request(app)
      .get("/api/registrations/00000000-0000-0000-0000-000000000000")
      .set("Cookie", part1Cookie);
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe("NOT_FOUND");

    const resBad = await request(app)
      .get("/api/registrations/abc-not-uuid")
      .set("Cookie", part1Cookie);
    expect(resBad.status).toBe(404);
    expect(resBad.body?.error?.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// TEST-506 / AC-506: Organizer calls either endpoint
// ---------------------------------------------------------------------------
describe("TEST-506 / AC-506: organizer access forbidden", () => {
  it("returns 403 for both list and detail endpoints", async () => {
    const resList = await request(app).get("/api/registrations").set("Cookie", orgCookie);
    expect(resList.status).toBe(403);
    expect(resList.body?.error?.code).toBe("FORBIDDEN");

    const resDetail = await request(app)
      .get("/api/registrations/00000000-0000-0000-0000-000000000000")
      .set("Cookie", orgCookie);
    expect(resDetail.status).toBe(403);
    expect(resDetail.body?.error?.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// TEST-507 / AC-507: Anonymous calls either endpoint
// ---------------------------------------------------------------------------
describe("TEST-507 / AC-507: anonymous access unauthenticated", () => {
  it("returns 401 for both endpoints without cookies", async () => {
    const resList = await request(app).get("/api/registrations");
    expect(resList.status).toBe(401);
    expect(resList.body?.error?.code).toBe("UNAUTHENTICATED");

    const resDetail = await request(app).get("/api/registrations/00000000-0000-0000-0000-000000000000");
    expect(resDetail.status).toBe(401);
    expect(resDetail.body?.error?.code).toBe("UNAUTHENTICATED");
  });
});

// ---------------------------------------------------------------------------
// TEST-508 / AC-508: No private fields exposed (NFR-07)
// ---------------------------------------------------------------------------
describe("TEST-508 / AC-508: privacy check", () => {
  it("never returns email, passwordHash or userId", async () => {
    const ev = await prisma.event.create({
      data: {
        title: "Atelier Docker",
        startsAt: new Date(Date.now() + 3 * 86400000),
        capacity: 10,
        status: "PUBLISHED",
        organizerId: orgId,
      },
    });

    const reg = await prisma.registration.create({
      data: { eventId: ev.id, userId: part1Id },
    });

    const resList = await request(app).get("/api/registrations").set("Cookie", part1Cookie);
    const resDetail = await request(app).get(`/api/registrations/${reg.id}`).set("Cookie", part1Cookie);

    for (const bodyStr of [JSON.stringify(resList.body), JSON.stringify(resDetail.body)]) {
      expect(bodyStr).not.toContain("passwordHash");
      expect(bodyStr).not.toContain("email");
      expect(bodyStr).not.toContain("userId");
      expect(bodyStr).not.toContain("organizerId");
    }
  });
});
