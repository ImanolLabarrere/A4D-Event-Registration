import * as fs from "fs";
import * as path from "path";

function readDoc(relPath: string): string {
  const p = path.resolve(__dirname, "..", relPath);
  return fs.readFileSync(p, "utf-8");
}

async function main() {
  const srs = readDoc("docs/srs.md");
  const features = readDoc("docs/features.md");
  const systemSds = readDoc("docs/system-sds.md");
  const plan = readDoc("docs/sprints/plan.md");
  const traceability = readDoc("docs/traceability.md");
  
  const f01 = readDoc("docs/sprints/sprint-1/F-01-auth.md");
  const f02 = readDoc("docs/sprints/sprint-1/F-02-events.md");
  const f03 = readDoc("docs/sprints/sprint-1/F-03-browse.md");
  const f04 = readDoc("docs/sprints/sprint-1/F-04-register.md");
  const f05 = readDoc("docs/sprints/sprint-1/F-05-my-registrations.md");
  const f06 = readDoc("docs/sprints/sprint-1/F-06-organizer-view.md");
  const dod = readDoc("docs/sprints/sprint-1/dod.md");

  const deliverableMd = `# CPE 334 — Project Deliverable 1
## Engineering Baseline and Working Sprint 1
**Semester:** 1/2026 | **Due Date:** 8 November 2026 at 23:59 | **Grade Weight:** 80 points (8%)

---

### Project & Submission Metadata
- **Theme / Selected Context:** University Department Workshop & Event Registration System (Theme: Event Registration and Attendance)
- **Repository URL:** [https://github.com/ImanolLabarrere/A4D-Event-Registration](https://github.com/ImanolLabarrere/A4D-Event-Registration)
- **Submitted Release Tag:** \`v0.1.0-sprint1\` (commit \`513b249\`)
- **Staging / Base Branches:** \`sprint-1\` merged into \`main\` via reviewed Pull Requests #23 and #24
- **Student Team:**
  - **Student A:** Xavier Gobert (\`xgobert@et.esiea.fr\` / GitHub: \`hoshiiiix\`) — *Travailleur A*
  - **Student B:** Imanol Labarrere (Student ID: \`69540460013\` / GitHub: \`ImanolLabarrere\`) — *Travailleur B*

---

### Navigation Table (Deliverable Structure)
| Section | Title | Content / Relevant IDs |
|---|---|---|
| **Part A** | SRS and Product Scope | Problem, Context, Actors, Scope/Exclusions, FR-01..12, BR-01..09, NFR-01..07, Decisions D-01..11, Assumptions A-01..07 |
| **Part B** | Feature Inventory and Traceability | Features F-01..F-12, Cross-cutting R-01..R-04, Full Requirements-to-Feature-to-Sprint Traceability, Coverage gaps |
| **Part C** | System-Level SDS | Architecture, Modular Monolith Stack, Data Model & Prisma Schema, Migrations, UI screens, API conventions, Role matrix, Security & GCP Plan |
| **Part D** | Three-Sprint Plan | Sprints 1, 2, 3 goals, feature allocations, dependencies, completion outcomes, Sprint 1 feasible scope justification |
| **Part E** | Sprint 1 Engineering Contracts | Full specifications, UI/API/Data models, AC-101..609, STS TEST-101..610 for F-01, F-02, F-03, F-04, F-05, F-06 and Product DoD v1.0 |
| **Part F** | Working Sprint 1 & Verification | Scenarios (normal, rejection, security), Test results (101 Vitest + 3 E2E Playwright), Code excerpts (TEST-411, TEST-603/604), TDD Red/Green cycles, PR evidence (#15, #20), Contribution table, AI declaration, Setup summary |

---

# Part A: Software Requirements Specification (SRS) & Product Scope
*(Score: 10 points)*

${srs}

---

# Part B: Feature Inventory and Traceability
*(Score: 10 points)*

${features}

## Traceability Matrix
${traceability}

---

# Part C: System-Level Software Design Specification (SDS)
*(Score: 15 points)*

${systemSds}

---

# Part D: Three-Sprint Plan
*(Score: 5 points)*

${plan}

---

# Part E: Sprint 1 Engineering Contracts & Definition of Done
*(Score: 20 points)*

> This section provides the complete, unabridged engineering contracts prepared before implementation for all Sprint 1 features, establishing the feature SDS, applicable UI/API/Data specifications, acceptance criteria (AC), and Software Test Specification (STS).

## 1. Product Definition of Done (DoD v1.0)
${dod}

---

## 2. Engineering Contract F-01: Authentication
${f01}

---

## 3. Engineering Contract F-02: Create and Publish Events
${f02}

---

## 4. Engineering Contract F-03: Browse Published Events
${f03}

---

## 5. Engineering Contract F-04: Register for an Event
${f04}

---

## 6. Engineering Contract F-05: My Registrations
${f05}

---

## 7. Engineering Contract F-06: Organizer View of Registrations
${f06}

---

# Part F: Working Sprint 1 & Verification
*(Score: 20 points)*

## 1. Program Demonstrations

### Scenario 1: Complete Normal Domain Journey
- **Linked Requirements & AC:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06 / AC-101, AC-201, AC-206, AC-301, AC-401, AC-501, AC-601
- **Tested Release Commit:** \`513b249\` (tag \`v0.1.0-sprint1\`)
- **Automated Reference:** Playwright E2E Test \`E2E-02: Complete lifecycle\` in \`tests/e2e/journey.spec.ts\`
- **Preconditions:** Seeded database (\`npm run db:seed\`) with \`organizer2@example.test\` and \`participant1@example.test\`.
- **Execution Steps:**
  1. **Organizer Login:** \`POST /api/auth/login\` with \`organizer2@example.test\` $\rightarrow$ HTTP 200, session cookie \`sid\` issued.
  2. **Event Creation:** Organizer sends \`POST /api/events\` with \`{ title: "E2E Grand Hackathon", startsAt: "+15 days", capacity: 2 }\` $\rightarrow$ HTTP 201 Created with status \`"DRAFT"\`.
  3. **Event Publication:** Organizer sends \`POST /api/events/:id/publish\` $\rightarrow$ HTTP 200 OK, event status transitions to \`"PUBLISHED"\`.
  4. **Organizer Logout:** \`POST /api/auth/logout\` $\rightarrow$ HTTP 204.
  5. **Participant Login:** \`POST /api/auth/login\` with \`participant1@example.test\` $\rightarrow$ HTTP 200.
  6. **Browse Events:** Participant calls \`GET /api/events\` $\rightarrow$ HTTP 200; the newly published event appears with \`remainingPlaces: 2\` and \`confirmedCount: 0\`.
  7. **Registration:** Participant calls \`POST /api/events/:id/registrations\` $\rightarrow$ HTTP 201 Created, returning \`{ id, eventId, status: "CONFIRMED", createdAt }\`.
  8. **Consult My Registrations:** Participant calls \`GET /api/registrations\` $\rightarrow$ HTTP 200, returning the confirmed registration linked to "E2E Grand Hackathon".
  9. **Consult Registration Detail:** Participant calls \`GET /api/registrations/:id\` $\rightarrow$ HTTP 200 with matching event title and status.
  10. **Organizer Checks Attendee List:** Organizer logs back in, calls \`GET /api/events/:id/registrations\` $\rightarrow$ HTTP 200, \`confirmedCount: 1\`, registrations array contains participant's email \`participant1@example.test\` and registration timestamp.
- **Expected Result:** Entire workflow succeeds across UI/API and database layer; state persists accurately.
- **Actual Result:** **PASS** (duration 468ms in E2E Playwright run).

---

### Scenario 2: Meaningful Business Rule and Boundary Rejections
- **Linked Rules:** BR-01, BR-02, BR-03, BR-04, BR-05, BR-06 / AC-201, AC-209, AC-403, AC-404, AC-405
- **Tested Release Commit:** \`513b249\`
- **Step-by-step Demonstration:**
  1. **Capacity $\le$ 0 (BR-01):** Organizer attempts \`POST /api/events\` with \`capacity: 0\`.  
     *Result:* HTTP 400 Bad Request with \`{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid event data" } }\`. Database \`CHECK (capacity > 0)\` also protects data integrity.
  2. **Past Publication Date (BR-02):** Organizer attempts to publish an event dated yesterday.  
     *Result:* HTTP 409 Conflict with \`{ "error": { "code": "EVENT_IN_PAST", "message": "The event date is not in the future" } }\`.
  3. **Duplicate Registration (BR-04):** Participant attempts to register twice for the same event.  
     *Result:* HTTP 409 Conflict with \`{ "error": { "code": "ALREADY_REGISTERED", "message": "You are already registered for this event" } }\`.
  4. **Capacity Exhaustion (BR-03):** Participant attempts to register when \`confirmedCount >= capacity\`.  
     *Result:* HTTP 409 Conflict with \`{ "error": { "code": "EVENT_FULL", "message": "The event is full" } }\`.
  5. **Registration for Past Event (BR-05):** Participant attempts to register for an event that has already started.  
     *Result:* HTTP 409 Conflict with \`{ "error": { "code": "EVENT_IN_PAST", "message": "The event has already started" } }\`.
- **Expected Result:** Every business rule strictly enforced server-side; appropriate HTTP 400/409 codes returned with standard D-08 error bodies.
- **Actual Result:** **PASS** (Verified across unit and integration suites).

---

### Scenario 3: Login/Logout, Role Boundaries & Ownership Enforcement
- **Linked Requirements:** NFR-01, NFR-06, BR-07, BR-09 / AC-102, AC-207, AC-308, AC-506, AC-603, AC-604
- **Tested Release Commit:** \`513b249\`
- **Automated Reference:** Playwright E2E Tests \`TEST-114\` and \`E2E-03\`
- **Step-by-step Demonstration:**
  1. **Unauthenticated Access:** Client calls \`GET /api/auth/me\` without cookie.  
     *Result:* HTTP 401 Unauthorized, \`{ "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }\`. No data returned.
  2. **Role Boundary — Event Creation by Participant:** Participant logs in and calls \`POST /api/events\`.  
     *Result:* HTTP 403 Forbidden, \`{ "error": { "code": "FORBIDDEN", "message": "Forbidden" } }\`.
  3. **Role Boundary — Event Management by Participant:** Participant calls \`GET /api/events/mine\`.  
     *Result:* HTTP 403 Forbidden.
  4. **Role Boundary — Registration Consultation by Organizer:** Organizer calls \`GET /api/registrations\`.  
     *Result:* HTTP 403 Forbidden.
  5. **Ownership Boundary — Other Organizer's Event:** Organizer 1 calls \`GET /api/events/:id/registrations\` for an event owned by Organizer 2.  
     *Result:* HTTP 404 Not Found (decision D-08 prevents leaking existence of private events to non-owners).
  6. **Session Expiry & Logout Invalidation:** User calls \`POST /api/auth/logout\`. Subsequent call to \`GET /api/auth/me\` returns HTTP 401.
- **Expected Result:** All endpoints enforce backend role checks (\`requireAuth\`, \`requireRole\`) and query-level ownership checks; client cannot bypass restrictions.
- **Actual Result:** **PASS**.

---

## 2. Build and Automated Test Results

### Commands and Environment
- **Unit and Integration Test Command:** \`npm test\` (\`vitest run\`)
- **End-to-End Test Command:** \`npm run test:e2e\` (\`playwright test\`)
- **Tested Commit:** \`513b249\` (tag \`v0.1.0-sprint1\`)
- **Database Engine:** PostgreSQL 16 on Docker container port 5433

### Execution Output Summary
\`\`\`text
========================= VITEST INTEGRATION & UNIT SUITE =========================
 ✓ tests/integration/browse.test.ts (12 tests) 4206ms
 ✓ tests/integration/register.test.ts (12 tests) 3339ms
 ✓ tests/integration/my-registrations.test.ts (8 tests) 2756ms
 ✓ tests/integration/organizer-view.test.ts (8 tests) 2485ms
 ✓ tests/integration/auth.test.ts (18 tests) 1365ms
 ✓ tests/integration/events-manage.test.ts (16 tests) 619ms
 ✓ tests/unit/auth-unit.test.ts (5 tests) 92ms
 ✓ tests/integration/event-constraints.test.ts (1 test) 96ms
 ✓ tests/unit/event-rules.test.ts (11 tests) 10ms
 ✓ tests/unit/registration-rules.test.ts (5 tests) 6ms
 ✓ tests/unit/browse-unit.test.ts (5 tests) 7ms

 Test Files  11 passed (11)
      Tests  101 passed (101) | 0 failed | 0 skipped
   Duration  23.37s

=========================== PLAYWRIGHT E2E SUITE ===========================
Running 3 tests using 1 worker
  ok 1 tests/e2e/journey.spec.ts › TEST-114 / E2E-01: Authentication journey (212ms)
  ok 2 tests/e2e/journey.spec.ts › E2E-02: Complete lifecycle (468ms)
  ok 3 tests/e2e/journey.spec.ts › E2E-03: Security & Role boundary enforcement (334ms)

  3 passed (6.1s) | 0 failed | 0 skipped
\`\`\`

### Comprehensive AC to Test Results Mapping
| AC ID | Planned TEST ID | Implementation Test File | Type | Result |
|---|---|---|---|---|
| AC-101..114 | TEST-101..114 | \`tests/integration/auth.test.ts\`, \`tests/unit/auth-unit.test.ts\`, \`tests/e2e/journey.spec.ts\` | Unit / API / E2E | **PASS** (24 tests) |
| AC-201..213 | TEST-201..214 | \`tests/integration/events-manage.test.ts\`, \`tests/unit/event-rules.test.ts\`, \`tests/integration/event-constraints.test.ts\` | Unit / API / DB | **PASS** (28 tests) |
| AC-301..313 | TEST-301..314 | \`tests/integration/browse.test.ts\`, \`tests/unit/browse-unit.test.ts\`, \`tests/e2e/journey.spec.ts\` | Unit / API / E2E | **PASS** (18 tests) |
| AC-401..412 | TEST-401..412 | \`tests/integration/register.test.ts\`, \`tests/unit/registration-rules.test.ts\`, \`tests/e2e/journey.spec.ts\` | Unit / API / Concurrency | **PASS** (18 tests) |
| AC-501..508 | TEST-501..508 | \`tests/integration/my-registrations.test.ts\`, \`tests/e2e/journey.spec.ts\` | API / E2E | **PASS** (9 tests) |
| AC-601..609 | TEST-601..610 | \`tests/integration/organizer-view.test.ts\`, \`tests/e2e/journey.spec.ts\` | API / E2E | **PASS** (9 tests) |

---

## 3. Selected Test Code Excerpts

### Excerpt 1: Critical Domain Rule & Concurrency (TEST-411 / NFR-03)
*File:* \`tests/integration/register.test.ts\`  
*Purpose:* Validates that when 20 simultaneous registration requests compete for the last available slot, row-level locking (\`SELECT ... FOR UPDATE\`) prevents overbooking.
\`\`\`typescript
test("TEST-411 / AC-409 / NFR-03: 20 simultaneous requests for the last place", async () => {
  // Event setup with capacity = 1
  const ev = await db.event.create({
    data: {
      title: "Concurrent Event",
      startsAt: new Date(Date.now() + 86400000),
      capacity: 1,
      status: "PUBLISHED",
      organizerId: org.id,
    },
  });

  // 20 distinct participants submit registration concurrently
  const responses = await Promise.all(
    participants.map((p) =>
      request(app)
        .post(\`/api/events/\${ev.id}/registrations\`)
        .set("Cookie", p.cookie)
    )
  );

  const successes = responses.filter((r) => r.status === 201);
  const fullRejections = responses.filter(
    (r) => r.status === 409 && r.body.error?.code === "EVENT_FULL"
  );

  // Exactly 1 success, 19 rejections, DB count equals capacity
  expect(successes).toHaveLength(1);
  expect(fullRejections).toHaveLength(19);
  const confirmed = await db.registration.count({
    where: { eventId: ev.id, status: "CONFIRMED" },
  });
  expect(confirmed).toBe(1);
});
\`\`\`

### Excerpt 2: Role and Ownership Restriction (TEST-603 / TEST-604)
*File:* \`tests/integration/organizer-view.test.ts\`  
*Purpose:* Proves that another organizer receives a 404 with zero leaked participant data, and participants receive a 403.
\`\`\`typescript
test("TEST-603 / AC-603: other organizer gets 404", async () => {
  // Organizer 2 requests registrations of Organizer 1's event
  const res = await request(app)
    .get(\`/api/events/\${org1Event.id}/registrations\`)
    .set("Cookie", org2Cookie);

  expect(res.status).toBe(404);
  expect(res.body.error?.code).toBe("NOT_FOUND");
  expect(JSON.stringify(res.body)).not.toContain("participant");
  expect(JSON.stringify(res.body)).not.toContain("@example.test");
});

test("TEST-604 / AC-604: participant gets 403", async () => {
  const res = await request(app)
    .get(\`/api/events/\${org1Event.id}/registrations\`)
    .set("Cookie", participantCookie);

  expect(res.status).toBe(403);
  expect(res.body.error?.code).toBe("FORBIDDEN");
});
\`\`\`

---

## 4. Test-Driven Development (TDD) Progression

In accordance with DoD item 3, every feature began with a failing test commit (Red) before the implementation made tests pass (Green). Evidence files are preserved in \`docs/evidence/\`.

| Feature | Red Commit & Evidence | Green Commit & Evidence | Summary of Change |
|---|---|---|---|
| **F-01 Auth** | \`3ec87e9\` (\`F-01-red.txt\`) | \`f9ec5ad\` (\`F-01-green.txt\`) | Argon2id verification, session cookie, \`requireAuth\` & \`requireRole\` |
| **F-02 Events** | \`307f5c6\` (\`F-02-red.txt\`, \`F-02-http-red.txt\`) | \`9fdab98\` (\`F-02-green.txt\`, \`F-02-http-green.txt\`) | Zod schema, \`canPublish\` rule, \`POST /api/events\` and \`/publish\` |
| **F-03 Browse** | \`9691d1e\` (\`F-03-red.txt\`) | \`c9945df\` (\`F-03-green.txt\`) | Public event listing, \`computeRemainingPlaces\`, organizer \`/mine\` |
| **F-04 Register** | \`a53cb3b\` (\`F-04-unit-red.txt\`, \`F-04-http-red.txt\`) | \`379ba22\` (\`F-04-unit-green.txt\`, \`F-04-http-green.txt\`) | Row lock (\`SELECT FOR UPDATE\`), \`decideRegistration\`, 20-client concurrency |
| **F-05 My Regs** | \`75ee461\` (\`F-05-red.txt\`) | \`dc1917b\` (\`F-05-green.txt\`) | Participant-isolated \`GET /api/registrations\` and \`/:id\` |
| **F-06 Org View** | \`50c6bf2\` (\`F-06-red.txt\`) | \`46654e5\` (\`F-06-green.txt\`) | Owner attendee list, privacy projection (only id/email exposed) |

---

## 5. Engineering Workflow and Peer Review Evidence

All development was executed through dedicated Git branches and thoroughly reviewed pull requests into \`sprint-1\`, followed by a reviewed release PR into \`main\`.

### Sampled Pull Request 1: PR #15 (F-01 Authentication)
- **Branch:** \`feature/F-01-auth\` $\rightarrow$ \`sprint-1\`
- **Author:** Imanol Labarrere (B) | **Reviewer:** Xavier Gobert (A)
- **Review Finding & Check:**
  > *"Verified that \`requireAuth\` reads only from the httpOnly cookie and that session expiry deletes the row in the DB. Timing-safe argon2 verify properly handles dummy hash. Approved."*
- **Outcome:** Merged into \`sprint-1\` (commit \`3a0f5aa\`).

### Sampled Pull Request 2: PR #20 (F-04 Register & Concurrency Lock)
- **Branch:** \`feature/F-04-register\` $\rightarrow$ \`sprint-1\`
- **Author:** Xavier Gobert (A) | **Reviewer:** Imanol Labarrere (B)
- **Substantive Review Finding:**
  > *"Verified row-level lock: \`SELECT ... FOR UPDATE\` runs before reading confirmedCount, serializing concurrent transactions and satisfying NFR-03. Priority order in \`decideRegistration\` respects PAST > DUPLICATE > FULL. Non-blocking observation: Prisma transaction timeout (10s) protects against deadlocks; in a follow-up, Prisma error P2024 could be mapped to 503 instead of generic 500. Approved."*
- **Outcome:** Merged into \`sprint-1\` (commit \`d8977a1\`).

### Release PRs: PR #23 & PR #24
- **Base:** \`main\` $\leftarrow$ **Head:** \`sprint-1\`
- **Reviewer:** Xavier Gobert (A)
- **Result:** Successfully approved and merged into \`main\`. Tagged \`v0.1.0-sprint1\`.

---

## 6. Team Contributions Table

| Area | Student A (Xavier Gobert — \`hoshiiiix\`) | Student B (Imanol Labarrere — \`ImanolLabarrere\`) |
|---|---|---|
| **Specifications** | Authored contracts: F-02, F-04, F-05, and DoD v1.0 | Authored baseline SRS, SDS, contracts F-01, F-03, F-06, traceability |
| **Development** | Implemented F-02 (Events) and F-04 (Register with concurrency row lock) | Implemented project skeleton, DB schema/migrations, F-01 (Auth), F-03 (Browse), F-05 (My Regs), F-06 (Org View) |
| **Testing** | Authored unit & integration tests for F-02 and F-04 (including TEST-411) | Authored unit & integration tests for F-01, F-03, F-05, F-06; authored Playwright E2E suite |
| **Code Review** | Relue et approuvé PR #10, PR #11, PR #15, PR #16, PR #17, PR #21, PR #22, PR #23, PR #24 | Relue et approuvé PR #12, PR #13, PR #14, PR #18, PR #19, PR #20 |
| **Operations** | Authored README local setup & test DB guide | Executed Docker persistence test (NFR-04), Git secret check (NFR-05), release tagging |

---

## 7. AI-Use Declaration
In compliance with course requirements:
- **AI Tool Used:** Google Antigravity (Claude Sonnet 4.6 & Gemini 3.8 Flash).
- **Scope of AI Assistance:** Used as an interactive pair programming partner for generating test fixtures, drafting TypeScript boilerplate and types, assisting in git conflict resolution, and formatting Markdown tables.
- **Human Verification:** All architectural decisions (row-level locking, Argon2id parameters, session cookie flags, status code conventions), business rules logic, test assertions, review findings, and evidence validations were designed, inspected, and verified directly by the students.

---

## 8. Known Incomplete Work and Limitations
- **Current Scope:** Sprint 1 scope is 100% complete. All planned 101 unit/integration tests and 3 E2E journeys pass without failures or skips.
- **Frontend UI:** In Sprint 1, user journeys are exercised through Playwright API end-to-end scenarios; the full React/Vite single-page application is scheduled for development in Sprint 2.
- **Upcoming Features (Sprint 2):** Registrations cannot yet be cancelled (F-07), and the 20% waiting list (F-08) is deferred to Sprint 2 as planned in the 3-sprint roadmap.

---

## 9. Reproduction Instructions (Quick Setup)
For the TA or instructor evaluating this submission:

\`\`\`bash
# 1. Clone repository and access release tag
git clone https://github.com/ImanolLabarrere/A4D-Event-Registration.git
cd A4D-Event-Registration
git checkout v0.1.0-sprint1

# 2. Configure environment
cp .env.example .env
# Set SEED_PASSWORD=demo_seed_2026 and DB_PASSWORD=a4d_dev_2026 in .env

# 3. Start PostgreSQL container
docker compose up -d

# 4. Install dependencies and run database migrations
npm ci
npx prisma migrate deploy
npm run db:seed

# 5. Prepare test database and run automated test suite
docker compose exec db psql -U a4d -d a4d -c "CREATE DATABASE a4d_test;"
npx prisma migrate deploy --schema=src/server/db/schema.prisma
npm test
npm run test:e2e
\`\`\`

---
*End of Deliverable 1 Document.*
`;

  const outPath = path.resolve(__dirname, "../docs/deliverable-sprint-1.md");
  fs.writeFileSync(outPath, deliverableMd, "utf-8");
  console.log("Full deliverable markdown generated at:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
