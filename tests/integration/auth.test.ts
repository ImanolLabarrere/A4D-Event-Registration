import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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
  return { res, cookie: (res.headers["set-cookie"] as string[] | undefined)?.[0] ?? "" };
}

// ---------------------------------------------------------------------------
// TEST-103 / AC-101, AC-109 — Valid login
// ---------------------------------------------------------------------------
describe("TEST-103 / AC-101, AC-109: valid login", () => {
  it("returns 200 with id/email/role and sets an httpOnly sid cookie", async () => {
    const { res, cookie } = await loginAs("organizer1@example.test");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: expect.any(String), email: "organizer1@example.test", role: "ORGANIZER" });
    expect(res.body.passwordHash).toBeUndefined();
    expect(cookie).toContain("sid=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(cookie).toContain("Path=/");

    // Session row exists in DB
    const sid = cookie.split("sid=")[1].split(";")[0];
    const session = await prisma.session.findUnique({ where: { id: sid } });
    expect(session).not.toBeNull();
    const diffMs = session!.expiresAt.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(7.9 * 3600 * 1000);
    expect(diffMs).toBeLessThan(8.1 * 3600 * 1000);
  });
});

// ---------------------------------------------------------------------------
// TEST-104 / AC-102 — Wrong password
// ---------------------------------------------------------------------------
describe("TEST-104 / AC-102: wrong password", () => {
  it("returns 401 INVALID_CREDENTIALS and no cookie", async () => {
    const count = await prisma.session.count();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "organizer1@example.test", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("INVALID_CREDENTIALS");
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(await prisma.session.count()).toBe(count);
  });
});

// ---------------------------------------------------------------------------
// TEST-105 / AC-103 — Unknown email
// ---------------------------------------------------------------------------
describe("TEST-105 / AC-103: unknown email", () => {
  it("returns the same 401 body as a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.test", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("INVALID_CREDENTIALS");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TEST-106 / AC-104 — Validation errors
// ---------------------------------------------------------------------------
describe("TEST-106 / AC-104: validation errors", () => {
  it.each([
    [{}],
    [{ email: "", password: "" }],
    [{ email: 42, password: "pw" }],
    [{ email: "a@b.com" }],
    [{ password: "pw" }],
  ])("returns 400 VALIDATION_ERROR for body %o", async (body) => {
    const count = await prisma.session.count();
    const res = await request(app).post("/api/auth/login").send(body);
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(await prisma.session.count()).toBe(count);
  });
});

// ---------------------------------------------------------------------------
// TEST-107 / AC-113 — Case-insensitive email and trimming
// ---------------------------------------------------------------------------
describe("TEST-107 / AC-113: email normalisation", () => {
  it("accepts upper-case email and surrounding spaces", async () => {
    const { res } = await loginAs("  PARTICIPANT1@example.test  ");
    // Note: loginAs sends the given value directly
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "  PARTICIPANT1@EXAMPLE.TEST  ", password: process.env.SEED_PASSWORD });
    expect(res2.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// TEST-108 / AC-105 — GET /api/auth/me with valid cookie
// ---------------------------------------------------------------------------
describe("TEST-108 / AC-105: GET /api/auth/me with valid cookie", () => {
  it("returns 200 with the session user identity", async () => {
    const { cookie } = await loginAs("participant1@example.test");
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "participant1@example.test", role: "PARTICIPANT" });
    expect(res.body.passwordHash).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TEST-109 / AC-106, AC-114 — Unauthenticated /me
// ---------------------------------------------------------------------------
describe("TEST-109 / AC-106, AC-114: unauthenticated /me", () => {
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("UNAUTHENTICATED");
    expect(JSON.stringify(res.body)).not.toMatch(/email|role|id/);
  });

  it("returns 401 with a garbage cookie value", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "sid=garbage12345");
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("UNAUTHENTICATED");
  });
});

// ---------------------------------------------------------------------------
// TEST-110 / AC-107 — Logout and old cookie reuse
// ---------------------------------------------------------------------------
describe("TEST-110 / AC-107: logout and old cookie reuse", () => {
  it("204 on logout; old cookie gets 401; second logout is 204", async () => {
    const { cookie } = await loginAs("participant2@example.test");
    const sid = cookie.split("sid=")[1].split(";")[0];

    const logout1 = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout1.status).toBe(204);

    // Session row deleted
    const session = await prisma.session.findUnique({ where: { id: sid } });
    expect(session).toBeNull();

    // Old cookie rejected
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);

    // Second logout is idempotent
    const logout2 = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout2.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// TEST-111 / AC-108 — Expired session
// ---------------------------------------------------------------------------
describe("TEST-111 / AC-108: expired session deleted on use", () => {
  it("returns 401 and removes the expired row", async () => {
    // Insert an expired session directly
    const user = await prisma.user.findFirstOrThrow({ where: { role: "PARTICIPANT" } });
    const expiredId = "expired" + Date.now().toString(16).padStart(50, "0");
    await prisma.session.create({
      data: { id: expiredId, userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).get("/api/auth/me").set("Cookie", `sid=${expiredId}`);
    expect(res.status).toBe(401);

    const gone = await prisma.session.findUnique({ where: { id: expiredId } });
    expect(gone).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TEST-112 / AC-110 — Password hashing
// ---------------------------------------------------------------------------
describe("TEST-112 / AC-110: password storage and responses", () => {
  it("stored hash starts with $argon2id$", async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { role: "ORGANIZER" } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toBe(process.env.SEED_PASSWORD);
  });

  it("login response contains no passwordHash", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "organizer1@example.test", password: process.env.SEED_PASSWORD });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("/me response contains no passwordHash", async () => {
    const { cookie } = await loginAs("organizer1@example.test");
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});

// ---------------------------------------------------------------------------
// TEST-113 / AC-112 — Client-supplied identity ignored
// ---------------------------------------------------------------------------
describe("TEST-113 / AC-112: client-supplied identity ignored", () => {
  it("ignores X-User-Role header and query userId", async () => {
    const { cookie } = await loginAs("participant1@example.test");
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .set("X-User-Role", "ORGANIZER")
      .query({ userId: "fake-id" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("PARTICIPANT");
    expect(res.body.id).not.toBe("fake-id");
  });
});

afterAll(() => prisma.$disconnect());

