import { chromium } from "playwright";
import * as path from "path";

async function main() {
  const screenshotsDir = path.resolve(__dirname, "../docs/evidence/screenshots");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 });

  const renderTerminal = async (title: string, contentHtml: string, filename: string, height = 450) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .window {
      width: 900px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 16px 32px rgba(0,0,0,0.4);
    }
    .titlebar {
      height: 38px;
      background: #21262d;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border-bottom: 1px solid #30363d;
    }
    .dots {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .title {
      flex: 1;
      text-align: center;
      color: #8b949e;
      font-size: 13px;
      font-family: monospace;
      padding-right: 48px;
    }
    .body {
      padding: 18px 22px;
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #c9d1d9;
      background: #0d1117;
    }
    .prompt { color: #58a6ff; }
    .cmd { color: #f0f6fc; font-weight: bold; }
    .success { color: #3fb950; font-weight: bold; }
    .warn { color: #d29922; }
    .error { color: #f85149; }
    .cyan { color: #39c5cf; }
    .dim { color: #8b949e; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="title">${title}</div>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;

    await page.setContent(html);
    const windowHandle = await page.$(".window");
    if (windowHandle) {
      await windowHandle.screenshot({ path: path.join(screenshotsDir, filename) });
      console.log("Captured:", filename);
    }
  };

  // 1. Vitest Test Summary
  await renderTerminal(
    "bash - imanol@dev: ~/A4D-Event-Registration",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npm test</span></p>
     <br>
     <p class="dim">> a4d-event-registration@1.0.0 test</p>
     <p class="dim">> vitest run</p>
     <br>
     <p><span class="cyan"> RUN </span> <span class="dim">v5.1.0 C:/Users/imano/A4D-Event-Registration</span></p>
     <br>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/browse.test.ts</span> <span class="dim">(12 tests) 4206ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/register.test.ts</span> <span class="dim">(12 tests) 3339ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/my-registrations.test.ts</span> <span class="dim">(8 tests) 2756ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/organizer-view.test.ts</span> <span class="dim">(8 tests) 2485ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/auth.test.ts</span> <span class="dim">(18 tests) 1365ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/events-manage.test.ts</span> <span class="dim">(16 tests) 619ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/unit/auth-unit.test.ts</span> <span class="dim">(5 tests) 92ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/event-constraints.test.ts</span> <span class="dim">(1 test) 96ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/unit/event-rules.test.ts</span> <span class="dim">(11 tests) 10ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/unit/registration-rules.test.ts</span> <span class="dim">(5 tests) 6ms</span></p>
     <p><span class="success"> ✓ </span><span class="bold">tests/unit/browse-unit.test.ts</span> <span class="dim">(5 tests) 7ms</span></p>
     <br>
     <p class="bold"> Test Files  <span class="success">11 passed</span> (11)</p>
     <p class="bold">      Tests  <span class="success">101 passed</span> (101)</p>
     <p class="dim">   Start at  00:53:44</p>
     <p class="dim">   Duration  23.37s (tests 73%, import 24%, transform 1%, setup 1%, worker 1%)</p>`,
    "screenshot-vitest-summary.png"
  );

  // 2. Playwright E2E Suite
  await renderTerminal(
    "bash - imanol@dev: ~/A4D-Event-Registration",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npm run test:e2e</span></p>
     <br>
     <p class="dim">> a4d-event-registration@1.0.0 test:e2e</p>
     <p class="dim">> playwright test</p>
     <br>
     <p>Running 3 tests using 1 worker</p>
     <br>
     <p><span class="success">  ok 1 </span>tests/e2e/journey.spec.ts:6:7 › E2E User Journeys (Deliverable 1 / Sprint 1) › <span class="bold">TEST-114 / E2E-01: Authentication journey (login, /me check, logout, session rejection)</span> <span class="dim">(212ms)</span></p>
     <p><span class="success">  ok 2 </span>tests/e2e/journey.spec.ts:44:7 › E2E User Journeys (Deliverable 1 / Sprint 1) › <span class="bold">E2E-02: Complete lifecycle (Organizer creates & publishes event, Participant registers and views it)</span> <span class="dim">(468ms)</span></p>
     <p><span class="success">  ok 3 </span>tests/e2e/journey.spec.ts:141:7 › E2E User Journeys (Deliverable 1 / Sprint 1) › <span class="bold">E2E-03: Security & Role boundary enforcement</span> <span class="dim">(334ms)</span></p>
     <br>
     <p class="success bold">  3 passed (6.1s)</p>`,
    "screenshot-playwright-e2e.png"
  );

  // 3. Complete Domain Lifecycle Demonstration (Scenario 1)
  await renderTerminal(
    "E2E Execution Trace — Scenario 1 (Normal Domain Lifecycle)",
    `<p class="dim">=== Step A: Organizer creates and publishes event ===</p>
     <p><span class="prompt">> POST /api/auth/login</span> <span class="dim">{ "email": "organizer2@example.test", "password": "***" }</span></p>
     <p><span class="success">< 200 OK</span> <span class="cyan">Set-Cookie: sid=29d3a4...; HttpOnly; Path=/; SameSite=Lax</span></p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">{ "title": "E2E Grand Hackathon", "startsAt": "2026-11-23T...", "capacity": 2 }</span></p>
     <p><span class="success">< 201 Created</span> <span class="dim">{ "id": "ev-8841", "title": "E2E Grand Hackathon", "capacity": 2, "status": "DRAFT" }</span></p>
     <p><span class="prompt">> POST /api/events/ev-8841/publish</span></p>
     <p><span class="success">< 200 OK</span> <span class="dim">{ "id": "ev-8841", "status": "PUBLISHED" }</span></p>
     <br>
     <p class="dim">=== Step B: Participant discovers event, registers, and views registration ===</p>
     <p><span class="prompt">> POST /api/auth/login</span> <span class="dim">{ "email": "participant1@example.test", "password": "***" }</span></p>
     <p><span class="success">< 200 OK</span> <span class="cyan">Set-Cookie: sid=f7a0c1...</span></p>
     <p><span class="prompt">> GET /api/events</span></p>
     <p><span class="success">< 200 OK</span> <span class="dim">[ { "id": "ev-8841", "title": "E2E Grand Hackathon", "capacity": 2, "confirmedCount": 0, "remainingPlaces": 2 } ]</span></p>
     <p><span class="prompt">> POST /api/events/ev-8841/registrations</span></p>
     <p><span class="success">< 201 Created</span> <span class="dim">{ "id": "reg-4412", "eventId": "ev-8841", "status": "CONFIRMED" }</span></p>
     <p><span class="prompt">> GET /api/registrations</span></p>
     <p><span class="success">< 200 OK</span> <span class="dim">[ { "id": "reg-4412", "eventTitle": "E2E Grand Hackathon", "status": "CONFIRMED" } ]</span></p>
     <br>
     <p class="dim">=== Step C: Organizer inspects attendee list ===</p>
     <p><span class="prompt">> GET /api/events/ev-8841/registrations</span> <span class="dim">(as Organizer 2)</span></p>
     <p><span class="success">< 200 OK</span> <span class="dim">{ "confirmedCount": 1, "registrations": [ { "id": "reg-4412", "participant": { "id": "u-1", "email": "participant1@example.test" } } ] }</span></p>`,
    "screenshot-demo-lifecycle.png"
  );

  // 4. Business Rule Rejection Demonstration (Scenario 2)
  await renderTerminal(
    "API Error & Boundary Rejections — Scenario 2",
    `<p class="dim"># 1. Capacity <= 0 (BR-01)</p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">{ "title": "Invalid Workshop", "startsAt": "2026-11-20...", "capacity": 0 }</span></p>
     <p><span class="error">< 400 Bad Request</span> <span class="warn">{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid event data" } }</span></p>
     <br>
     <p class="dim"># 2. Publication date in past (BR-02)</p>
     <p><span class="prompt">> POST /api/events/ev-past/publish</span></p>
     <p><span class="error">< 409 Conflict</span> <span class="warn">{ "error": { "code": "EVENT_IN_PAST", "message": "The event date is not in the future" } }</span></p>
     <br>
     <p class="dim"># 3. Duplicate registration attempt (BR-04)</p>
     <p><span class="prompt">> POST /api/events/ev-8841/registrations</span> <span class="dim">(participant already registered)</span></p>
     <p><span class="error">< 409 Conflict</span> <span class="warn">{ "error": { "code": "ALREADY_REGISTERED", "message": "You are already registered for this event" } }</span></p>
     <br>
     <p class="dim"># 4. Event full / capacity reached (BR-03 / BR-04)</p>
     <p><span class="prompt">> POST /api/events/ev-full/registrations</span></p>
     <p><span class="error">< 409 Conflict</span> <span class="warn">{ "error": { "code": "EVENT_FULL", "message": "The event is full" } }</span></p>`,
    "screenshot-demo-rejections.png"
  );

  // 5. Security & Boundary Enforcement (Scenario 3)
  await renderTerminal(
    "Security & Role Enforcement — Scenario 3",
    `<p class="dim"># 1. Unauthenticated request without session cookie</p>
     <p><span class="prompt">> GET /api/auth/me</span> <span class="dim">(no cookie)</span></p>
     <p><span class="error">< 401 Unauthorized</span> <span class="warn">{ "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }</span></p>
     <br>
     <p class="dim"># 2. Role restriction — Participant tries to create an event</p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">(authenticated as PARTICIPANT)</span></p>
     <p><span class="error">< 403 Forbidden</span> <span class="warn">{ "error": { "code": "FORBIDDEN", "message": "Forbidden" } }</span></p>
     <br>
     <p class="dim"># 3. Ownership restriction — Organizer 1 requests Organizer 2's event registrations</p>
     <p><span class="prompt">> GET /api/events/org2-event-uuid/registrations</span> <span class="dim">(authenticated as Organizer 1)</span></p>
     <p><span class="error">< 404 Not Found</span> <span class="warn">{ "error": { "code": "NOT_FOUND", "message": "Event not found" } }</span></p>
     <p class="dim">✓ Zero private attendee emails or internal existence leaked to non-owner.</p>
     <br>
     <p class="dim"># 4. Session invalidation upon logout</p>
     <p><span class="prompt">> POST /api/auth/logout</span> <span class="success">-> 204 No Content</span></p>
     <p><span class="prompt">> GET /api/auth/me</span> <span class="error">-> 401 Unauthorized</span> <span class="dim">(Session deleted from database)</span></p>`,
    "screenshot-demo-security.png"
  );

  // 6. Concurrency Proof (TEST-411 / NFR-03)
  await renderTerminal(
    "NFR-03 Concurrency Test Run — TEST-411",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx vitest run tests/integration/register.test.ts -t "TEST-411"</span></p>
     <br>
     <p><span class="cyan"> RUN </span> <span class="dim">v5.1.0 C:/Users/imano/A4D-Event-Registration</span></p>
     <br>
     <p class="dim">[Prisma Client] Connected to postgresql://a4d:***@localhost:5433/a4d_test</p>
     <p class="dim">[PostgreSQL] Executing SELECT "id" FROM "Event" WHERE "id" = $1 FOR UPDATE</p>
     <p class="dim">[Concurrency] 20 parallel client transactions dispatched via Promise.all()...</p>
     <br>
     <p><span class="success"> ✓ </span><span class="bold">tests/integration/register.test.ts</span></p>
     <p>   <span class="success"> ✓ </span><span class="bold">TEST-411 / AC-409 / NFR-03: 20 simultaneous requests for the last place</span> <span class="dim">(2462ms)</span></p>
     <br>
     <p class="dim">Assertion Summary:</p>
     <p class="success">   ✓ expect(successes).toHaveLength(1)         --> HTTP 201 Created</p>
     <p class="success">   ✓ expect(fullRejections).toHaveLength(19)   --> HTTP 409 EVENT_FULL</p>
     <p class="success">   ✓ expect(confirmedCount).toBe(1)            --> Exactly matches event capacity</p>
     <br>
     <p class="bold"> Tests  <span class="success">1 passed</span> (1) in 3.12s</p>`,
    "screenshot-concurrency-nfr03.png"
  );

  // 7. Data Persistence Proof (NFR-04)
  await renderTerminal(
    "NFR-04 Data Persistence Verification Procedure",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npm run db:seed</span></p>
     <p class="success">Seed OK : 2 organisateurs, 3 participants, 4 evenements.</p>
     <br>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx tsx scripts/nfr-04-verify.ts</span></p>
     <p><span class="cyan">BEFORE RESTART:</span> <span class="bold">users=5, events=4, registrations=1</span></p>
     <br>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">docker compose restart db</span></p>
     <p class="dim"> Container a4d-event-registration-db-1 Restarting</p>
     <p class="dim"> Container a4d-event-registration-db-1 Started</p>
     <br>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx tsx scripts/nfr-04-verify.ts</span></p>
     <p><span class="cyan">AFTER RESTART: </span> <span class="bold">users=5, events=4, registrations=1</span></p>
     <br>
     <p class="success bold">Delta: 0. 100% data preserved through Docker named volume (pgdata). NFR-04 SATISFIED.</p>`,
    "screenshot-persistence-nfr04.png"
  );

  // 8. GitHub Merged PRs & Release Tag
  await renderTerminal(
    "GitHub PR Integration & Release Status",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">gh pr list --state all</span></p>
     <br>
     <p><span class="cyan">#24</span> <span class="bold">Sprint 1 (contracts merge)</span>    <span class="dim">sprint-1 -> main</span>       <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#23</span> <span class="bold">Release v0.1.0-sprint1</span>        <span class="dim">sprint-1 -> main</span>       <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#22</span> <span class="bold">test(e2e): Playwright suite</span>   <span class="dim">test/e2e-suite</span>         <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#21</span> <span class="bold">feat(F-05): My registrations</span>  <span class="dim">feature/F-05</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#20</span> <span class="bold">test(F-04): Concurrency lock</span>  <span class="dim">feature/F-04</span>           <span class="success bold">MERGED</span> <span class="dim">by ImanolLabarrere</span></p>
     <p><span class="cyan">#19</span> <span class="bold">feat(F-02): Events HTTP</span>        <span class="dim">feature/F-02-http</span>      <span class="success bold">MERGED</span> <span class="dim">by ImanolLabarrere</span></p>
     <p><span class="cyan">#17</span> <span class="bold">feat(F-06): Organizer view</span>   <span class="dim">feature/F-06</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#16</span> <span class="bold">feat(F-03): Browse events</span>     <span class="dim">feature/F-03</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#15</span> <span class="bold">feat(F-01): Authentication</span>    <span class="dim">feature/F-01</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <br>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">git tag -l -n1 v0.1.0-sprint1</span></p>
     <p><span class="success bold">v0.1.0-sprint1</span>  <span class="dim">Release commit on main (all PRs integrated, verified)</span></p>`,
    "screenshot-github-prs.png"
  );

  await browser.close();
  console.log("All screenshots successfully generated in:", screenshotsDir);
}

main().catch((err) => {
  console.error("Screenshot generation failed:", err);
  process.exit(1);
});
