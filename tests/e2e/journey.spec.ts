import { test, expect } from "@playwright/test";

const SEED_PASSWORD = process.env.SEED_PASSWORD || "demo_seed_2026";

test.describe("E2E User Journeys (Deliverable 1 / Sprint 1)", () => {
  test("TEST-114 / E2E-01: Authentication journey (login, /me check, logout, session rejection)", async ({
    request,
  }) => {
    // 1. Unauthenticated request to /me is rejected
    const unauthMe = await request.get("/api/auth/me");
    expect(unauthMe.status()).toBe(401);
    const unauthBody = await unauthMe.json();
    expect(unauthBody.error.code).toBe("UNAUTHENTICATED");

    // 2. Successful login with seeded organizer
    const loginRes = await request.post("/api/auth/login", {
      data: {
        email: "organizer1@example.test",
        password: SEED_PASSWORD,
      },
    });
    expect(loginRes.status()).toBe(200);
    const user = await loginRes.json();
    expect(user.email).toBe("organizer1@example.test");
    expect(user.role).toBe("ORGANIZER");

    // 3. Authenticated call to /me returns current user identity
    const authMe = await request.get("/api/auth/me");
    expect(authMe.status()).toBe(200);
    const meBody = await authMe.json();
    expect(meBody.id).toBe(user.id);
    expect(meBody.email).toBe("organizer1@example.test");
    expect(meBody.role).toBe("ORGANIZER");

    // 4. Logout invalidates the session
    const logoutRes = await request.post("/api/auth/logout");
    expect(logoutRes.status()).toBe(204);

    // 5. Subsequent request to /me is now rejected (401)
    const afterLogoutMe = await request.get("/api/auth/me");
    expect(afterLogoutMe.status()).toBe(401);
  });

  test("E2E-02: Complete lifecycle (Organizer creates & publishes event, Participant registers and views it)", async ({
    request,
  }) => {
    // --- Step A: Organizer creates & publishes an event ---
    const orgLogin = await request.post("/api/auth/login", {
      data: {
        email: "organizer2@example.test",
        password: SEED_PASSWORD,
      },
    });
    expect(orgLogin.status()).toBe(200);

    const startsAt = new Date(Date.now() + 15 * 86400000).toISOString();
    const createRes = await request.post("/api/events", {
      data: {
        title: "E2E Grand Hackathon",
        startsAt,
        capacity: 2,
      },
    });
    expect(createRes.status()).toBe(201);
    const createdEvent = await createRes.json();
    expect(createdEvent.status).toBe("DRAFT");
    expect(createdEvent.title).toBe("E2E Grand Hackathon");

    // Publish event
    const publishRes = await request.post(`/api/events/${createdEvent.id}/publish`);
    expect(publishRes.status()).toBe(200);
    const publishedEvent = await publishRes.json();
    expect(publishedEvent.status).toBe("PUBLISHED");

    // Organizer logs out
    await request.post("/api/auth/logout");

    // --- Step B: Participant discovers event, registers, and views registration ---
    const partLogin = await request.post("/api/auth/login", {
      data: {
        email: "participant1@example.test",
        password: SEED_PASSWORD,
      },
    });
    expect(partLogin.status()).toBe(200);

    // List events: the published event appears
    const listRes = await request.get("/api/events");
    expect(listRes.status()).toBe(200);
    const events = await listRes.json();
    const target = events.find((e: any) => e.id === createdEvent.id);
    expect(target).toBeDefined();
    expect(target.remainingPlaces).toBe(2);

    // Participant registers (F-04)
    const regRes = await request.post(`/api/events/${createdEvent.id}/registrations`);
    expect(regRes.status()).toBe(201);
    const regData = await regRes.json();
    expect(regData.status).toBe("CONFIRMED");
    expect(regData.eventId).toBe(createdEvent.id);

    // Verify duplicate registration is rejected with 409
    const dupRes = await request.post(`/api/events/${createdEvent.id}/registrations`);
    expect(dupRes.status()).toBe(409);
    const dupBody = await dupRes.json();
    expect(dupBody.error.code).toBe("ALREADY_REGISTERED");

    // Participant views "My registrations" (F-05)
    const myRegsRes = await request.get("/api/registrations");
    expect(myRegsRes.status()).toBe(200);
    const myRegs = await myRegsRes.json();
    const myTarget = myRegs.find((r: any) => r.id === regData.id);
    expect(myTarget).toBeDefined();
    expect(myTarget.eventTitle).toBe("E2E Grand Hackathon");

    // Participant checks detail of their registration
    const detailRes = await request.get(`/api/registrations/${regData.id}`);
    expect(detailRes.status()).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.id).toBe(regData.id);
    expect(detailData.eventTitle).toBe("E2E Grand Hackathon");

    // Participant logs out
    await request.post("/api/auth/logout");

    // --- Step C: Organizer views registration list for the event (F-06 / TEST-610) ---
    await request.post("/api/auth/login", {
      data: {
        email: "organizer2@example.test",
        password: SEED_PASSWORD,
      },
    });

    const eventRegsRes = await request.get(`/api/events/${createdEvent.id}/registrations`);
    expect(eventRegsRes.status()).toBe(200);
    const eventRegs = await eventRegsRes.json();
    expect(eventRegs.confirmedCount).toBe(1);
    expect(eventRegs.registrations[0].participant.email).toBe("participant1@example.test");
  });

  test("E2E-03: Security & Role boundary enforcement", async ({ request }) => {
    // 1. Participant tries to create an event -> 403 FORBIDDEN
    await request.post("/api/auth/login", {
      data: {
        email: "participant2@example.test",
        password: SEED_PASSWORD,
      },
    });

    const forbiddenCreate = await request.post("/api/events", {
      data: {
        title: "Malicious Event",
        startsAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        capacity: 10,
      },
    });
    expect(forbiddenCreate.status()).toBe(403);
    const createErr = await forbiddenCreate.json();
    expect(createErr.error.code).toBe("FORBIDDEN");

    // 2. Participant tries to list organizer's own events (/mine) -> 403
    const forbiddenMine = await request.get("/api/events/mine");
    expect(forbiddenMine.status()).toBe(403);

    // Logout
    await request.post("/api/auth/logout");

    // 3. Organizer tries to access participant's "My registrations" -> 403
    await request.post("/api/auth/login", {
      data: {
        email: "organizer1@example.test",
        password: SEED_PASSWORD,
      },
    });

    const forbiddenMyRegs = await request.get("/api/registrations");
    expect(forbiddenMyRegs.status()).toBe(403);
    const regErr = await forbiddenMyRegs.json();
    expect(regErr.error.code).toBe("FORBIDDEN");
  });
});
