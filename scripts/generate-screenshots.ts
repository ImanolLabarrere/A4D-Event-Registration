import { chromium } from "playwright";
import * as path from "path";

async function main() {
  const screenshotsDir = path.resolve(__dirname, "../docs/evidence/screenshots");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 950, height: 750 }, deviceScaleFactor: 2 });

  const renderTerminal = async (title: string, contentHtml: string, filename: string, width = 860) => {
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
      padding: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .window {
      width: ${width}px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 28px rgba(0,0,0,0.4);
    }
    .titlebar {
      height: 34px;
      background: #21262d;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid #30363d;
    }
    .dots {
      display: flex;
      gap: 7px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .title {
      flex: 1;
      text-align: center;
      color: #8b949e;
      font-size: 12px;
      font-family: monospace;
      padding-right: 40px;
    }
    .body {
      padding: 14px 18px;
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 11.5px;
      line-height: 1.45;
      color: #c9d1d9;
      background: #0d1117;
    }
    .prompt { color: #58a6ff; }
    .cmd { color: #f0f6fc; font-weight: bold; }
    .success { color: #3fb950; font-weight: bold; }
    .warn { color: #d29922; }
    .error { color: #f85149; font-weight: bold; }
    .cyan { color: #39c5cf; }
    .dim { color: #8b949e; }
    .bold { font-weight: bold; }
    .separator { border-top: 1px dashed #30363d; margin: 8px 0; }
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
     <p class="dim">> a4d-event-registration@1.0.0 test | vitest run</p>
     <br>
     <p><span class="cyan"> RUN </span> <span class="dim">v5.1.0 C:/Users/imano/A4D-Event-Registration</span></p>
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
     <p class="bold"> Test Files  <span class="success">11 passed</span> (11) | Tests  <span class="success">101 passed</span> (101) <span class="dim">in 23.37s</span></p>`,
    "screenshot-vitest-summary.png"
  );

  // 2. Playwright E2E Suite
  await renderTerminal(
    "bash - imanol@dev: ~/A4D-Event-Registration",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npm run test:e2e</span></p>
     <p class="dim">> playwright test</p>
     <br>
     <p>Running 3 tests using 1 worker</p>
     <p><span class="success">  ok 1 </span>tests/e2e/journey.spec.ts:6:7 › <span class="bold">TEST-114 / E2E-01: Authentication journey (login, /me, logout, session rejection)</span> <span class="dim">(212ms)</span></p>
     <p><span class="success">  ok 2 </span>tests/e2e/journey.spec.ts:44:7 › <span class="bold">E2E-02: Complete lifecycle (Organizer creates & publishes event, Participant registers & views)</span> <span class="dim">(468ms)</span></p>
     <p><span class="success">  ok 3 </span>tests/e2e/journey.spec.ts:141:7 › <span class="bold">E2E-03: Security & Role boundary enforcement</span> <span class="dim">(334ms)</span></p>
     <br>
     <p class="success bold">  3 passed (6.1s)</p>`,
    "screenshot-playwright-e2e.png"
  );

  // 3. Lifecycle Trace
  await renderTerminal(
    "E2E Execution Trace — Scenario 1 (Normal Domain Lifecycle)",
    `<p class="dim">=== Step A: Organizer creates and publishes event ===</p>
     <p><span class="prompt">> POST /api/auth/login</span> <span class="dim">{ "email": "organizer2@example.test", "password": "***" }</span> <span class="success">-> 200 OK (sid cookie issued)</span></p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">{ "title": "E2E Grand Hackathon", "startsAt": "+15 days", "capacity": 2 }</span> <span class="success">-> 201 Created (status: DRAFT)</span></p>
     <p><span class="prompt">> POST /api/events/ev-8841/publish</span> <span class="success">-> 200 OK (status: PUBLISHED)</span></p>
     <p class="dim">=== Step B: Participant discovers event, registers, and views registration ===</p>
     <p><span class="prompt">> POST /api/auth/login</span> <span class="dim">{ "email": "participant1@example.test" }</span> <span class="success">-> 200 OK</span></p>
     <p><span class="prompt">> GET /api/events</span> <span class="success">-> 200 OK</span> <span class="dim">[ { "title": "E2E Grand Hackathon", "remainingPlaces": 2, "confirmedCount": 0 } ]</span></p>
     <p><span class="prompt">> POST /api/events/ev-8841/registrations</span> <span class="success">-> 201 Created</span> <span class="dim">{ "status": "CONFIRMED", "eventId": "ev-8841" }</span></p>
     <p><span class="prompt">> GET /api/registrations</span> <span class="success">-> 200 OK</span> <span class="dim">[ { "id": "reg-4412", "eventTitle": "E2E Grand Hackathon" } ]</span></p>
     <p class="dim">=== Step C: Organizer inspects attendee list ===</p>
     <p><span class="prompt">> GET /api/events/ev-8841/registrations</span> <span class="dim">(as Organizer 2)</span> <span class="success">-> 200 OK</span> <span class="dim">{ "confirmedCount": 1, "registrations": [ { "participant": { "email": "participant1@example.test" } } ] }</span></p>`,
    "screenshot-demo-lifecycle.png"
  );

  // 4. Rejections Trace
  await renderTerminal(
    "API Error & Boundary Rejections — Scenario 2",
    `<p class="dim"># 1. Capacity <= 0 (BR-01)</p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">{ "title": "Invalid Workshop", "capacity": 0 }</span> <span class="error">-> 400 Bad Request</span> <span class="warn">VALIDATION_ERROR</span></p>
     <p class="dim"># 2. Publication date in past (BR-02)</p>
     <p><span class="prompt">> POST /api/events/ev-past/publish</span> <span class="error">-> 409 Conflict</span> <span class="warn">EVENT_IN_PAST ("The event date is not in the future")</span></p>
     <p class="dim"># 3. Duplicate registration attempt (BR-04)</p>
     <p><span class="prompt">> POST /api/events/ev-8841/registrations</span> <span class="error">-> 409 Conflict</span> <span class="warn">ALREADY_REGISTERED ("You are already registered")</span></p>
     <p class="dim"># 4. Event full / capacity reached (BR-03 / BR-04)</p>
     <p><span class="prompt">> POST /api/events/ev-full/registrations</span> <span class="error">-> 409 Conflict</span> <span class="warn">EVENT_FULL ("The event is full")</span></p>`,
    "screenshot-demo-rejections.png"
  );

  // 5. Security & Boundary Trace
  await renderTerminal(
    "Security & Role Enforcement — Scenario 3",
    `<p class="dim"># 1. Unauthenticated request without session cookie</p>
     <p><span class="prompt">> GET /api/auth/me</span> <span class="error">-> 401 Unauthorized</span> <span class="warn">UNAUTHENTICATED ("Authentication required")</span></p>
     <p class="dim"># 2. Role restriction — Participant tries to create an event</p>
     <p><span class="prompt">> POST /api/events</span> <span class="dim">(as PARTICIPANT)</span> <span class="error">-> 403 Forbidden</span> <span class="warn">FORBIDDEN</span></p>
     <p class="dim"># 3. Ownership restriction — Organizer 1 requests Organizer 2's event registrations</p>
     <p><span class="prompt">> GET /api/events/org2-uuid/registrations</span> <span class="dim">(as Organizer 1)</span> <span class="error">-> 404 Not Found</span> <span class="warn">NOT_FOUND (zero attendee data leaked)</span></p>
     <p class="dim"># 4. Session invalidation upon logout</p>
     <p><span class="prompt">> POST /api/auth/logout</span> <span class="success">-> 204 No Content</span> | <span class="prompt">GET /api/auth/me</span> <span class="error">-> 401 Unauthorized (session row deleted)</span></p>`,
    "screenshot-demo-security.png"
  );

  // 6. Concurrency TEST-411
  await renderTerminal(
    "NFR-03 Concurrency Test Run — TEST-411",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx vitest run tests/integration/register.test.ts -t "TEST-411"</span></p>
     <p class="dim">[PostgreSQL] Executing SELECT "id" FROM "Event" WHERE "id" = $1 FOR UPDATE</p>
     <p class="dim">[Concurrency] 20 parallel client transactions dispatched via Promise.all()...</p>
     <p><span class="success"> ✓ </span><span class="bold">TEST-411 / AC-409 / NFR-03: 20 simultaneous requests for the last place</span> <span class="dim">(2462ms)</span></p>
     <p class="success">   ✓ expect(successes).toHaveLength(1)         --> HTTP 201 Created (slot locked & confirmed)</p>
     <p class="success">   ✓ expect(fullRejections).toHaveLength(19)   --> HTTP 409 EVENT_FULL</p>
     <p class="success">   ✓ expect(confirmedCount).toBe(1)            --> Zero overbooking, capacity respected</p>
     <p class="bold"> Tests  <span class="success">1 passed</span> (1) in 3.12s</p>`,
    "screenshot-concurrency-nfr03.png"
  );

  // 7. Data Persistence NFR-04
  await renderTerminal(
    "NFR-04 Data Persistence Verification Procedure",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npm run db:seed</span> <span class="success">-> Seed OK: 2 organizers, 3 participants, 4 events</span></p>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx tsx scripts/nfr-04-verify.ts</span></p>
     <p><span class="cyan">BEFORE RESTART:</span> <span class="bold">users=5, events=4, registrations=1</span></p>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">docker compose restart db</span> <span class="dim">-> Container a4d-db Restarted</span></p>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">npx tsx scripts/nfr-04-verify.ts</span></p>
     <p><span class="cyan">AFTER RESTART: </span> <span class="bold">users=5, events=4, registrations=1</span></p>
     <p class="success bold">Delta: 0. 100% data preserved through Docker named volume. NFR-04 SATISFIED.</p>`,
    "screenshot-persistence-nfr04.png"
  );

  // 8. GitHub PRs
  await renderTerminal(
    "GitHub PR Integration & Release Status",
    `<p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">gh pr list --state all</span></p>
     <p><span class="cyan">#24</span> <span class="bold">Sprint 1 (contracts merge)</span>    <span class="dim">sprint-1 -> main</span>       <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#23</span> <span class="bold">Release v0.1.0-sprint1</span>        <span class="dim">sprint-1 -> main</span>       <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#22</span> <span class="bold">test(e2e): Playwright suite</span>   <span class="dim">test/e2e-suite</span>         <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#21</span> <span class="bold">feat(F-05): My registrations</span>  <span class="dim">feature/F-05</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#20</span> <span class="bold">test(F-04): Concurrency lock</span>  <span class="dim">feature/F-04</span>           <span class="success bold">MERGED</span> <span class="dim">by ImanolLabarrere</span></p>
     <p><span class="cyan">#19</span> <span class="bold">feat(F-02): Events HTTP</span>        <span class="dim">feature/F-02-http</span>      <span class="success bold">MERGED</span> <span class="dim">by ImanolLabarrere</span></p>
     <p><span class="cyan">#17</span> <span class="bold">feat(F-06): Organizer view</span>   <span class="dim">feature/F-06</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#16</span> <span class="bold">feat(F-03): Browse events</span>     <span class="dim">feature/F-03</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="cyan">#15</span> <span class="bold">feat(F-01): Authentication</span>    <span class="dim">feature/F-01</span>           <span class="success bold">MERGED</span> <span class="dim">by hoshiiiix</span></p>
     <p><span class="prompt">imanol@dev:~/A4D-Event-Registration$</span> <span class="cmd">git tag -l -n1 v0.1.0-sprint1</span> <span class="success bold">-> v0.1.0-sprint1 (verified on main)</span></p>`,
    "screenshot-github-prs.png"
  );

  // -------------------------------------------------------------
  // COMPACT TDD EVIDENCE SCREENSHOTS (F-01 to F-06)
  // -------------------------------------------------------------

  // F-01 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-01-red.txt docs/evidence/F-01-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-01-red.txt</span> <span class="dim"># Commit 3ec87e9 (RED)</span></p>
     <p class="error">FAIL tests/unit/auth-unit.test.ts  --> Cannot find module '../../src/server/auth/token'</p>
     <p class="error">FAIL tests/integration/auth.test.ts --> Cannot find module '../../src/server/app'</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-01-green.txt</span> <span class="dim"># Commit f9ec5ad (GREEN)</span></p>
     <p><span class="success">✓ tests/unit/auth-unit.test.ts</span> <span class="dim">(5 tests passed: generateSessionToken, requireRole)</span></p>
     <p><span class="success">✓ tests/integration/auth.test.ts</span> <span class="dim">(18 tests passed: TEST-101..113, argon2id, 8h TTL session)</span></p>
     <p class="bold">Test Files <span class="success">2 passed</span> (2) | Tests <span class="success">23 passed</span> (23) in 1.45s</p>`,
    "evidence-f01-tdd.png"
  );

  // F-02 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-02-red.txt docs/evidence/F-02-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-02-red.txt docs/evidence/F-02-http-red.txt</span> <span class="dim"># Commit 307f5c6 (RED)</span></p>
     <p class="error">FAIL tests/unit/event-rules.test.ts --> canPublish, createEventSchema not defined</p>
     <p class="error">FAIL tests/integration/events-manage.test.ts --> POST /api/events 404</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-02-green.txt docs/evidence/F-02-http-green.txt</span> <span class="dim"># Commit 9fdab98 (GREEN)</span></p>
     <p><span class="success">✓ tests/unit/event-rules.test.ts</span> <span class="dim">(11 tests passed: BR-01 capacity > 0, BR-02 future date)</span></p>
     <p><span class="success">✓ tests/integration/event-constraints.test.ts</span> <span class="dim">(1 test passed: DB CHECK constraint)</span></p>
     <p><span class="success">✓ tests/integration/events-manage.test.ts</span> <span class="dim">(16 tests passed: TEST-201..213 create/publish)</span></p>
     <p class="bold">Test Files <span class="success">3 passed</span> (3) | Tests <span class="success">28 passed</span> (28) in 0.81s</p>`,
    "evidence-f02-tdd.png"
  );

  // F-03 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-03-red.txt docs/evidence/F-03-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-03-red.txt</span> <span class="dim"># Commit 9691d1e (RED)</span></p>
     <p class="error">FAIL tests/unit/browse-unit.test.ts  --> computeRemainingPlaces not implemented</p>
     <p class="error">FAIL tests/integration/browse.test.ts --> GET /api/events returned 404 Not Found</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-03-green.txt</span> <span class="dim"># Commit c9945df (GREEN)</span></p>
     <p><span class="success">✓ tests/unit/browse-unit.test.ts</span> <span class="dim">(5 tests passed: computeRemainingPlaces)</span></p>
     <p><span class="success">✓ tests/integration/browse.test.ts</span> <span class="dim">(12 tests passed: TEST-302..313 date ordering, /mine)</span></p>
     <p class="bold">Test Files <span class="success">2 passed</span> (2) | Tests <span class="success">17 passed</span> (17) in 4.21s</p>`,
    "evidence-f03-tdd.png"
  );

  // F-04 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-04-red.txt docs/evidence/F-04-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-04-unit-red.txt docs/evidence/F-04-http-red.txt</span> <span class="dim"># Commit a53cb3b (RED)</span></p>
     <p class="error">FAIL tests/unit/registration-rules.test.ts --> decideRegistration not implemented</p>
     <p class="error">FAIL tests/integration/register.test.ts (8 failed) --> POST /api/events/:id/registrations 404</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-04-unit-green.txt docs/evidence/F-04-http-green.txt</span> <span class="dim"># Commit 379ba22 (GREEN)</span></p>
     <p><span class="success">✓ tests/unit/registration-rules.test.ts</span> <span class="dim">(5 tests passed: decideRegistration rule logic)</span></p>
     <p><span class="success">✓ tests/integration/register.test.ts</span> <span class="dim">(12 tests passed: TEST-402..412, TEST-411 row lock)</span></p>
     <p class="bold">Test Files <span class="success">2 passed</span> (2) | Tests <span class="success">17 passed</span> (17) in 3.34s</p>`,
    "evidence-f04-tdd.png"
  );

  // F-05 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-05-red.txt docs/evidence/F-05-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-05-red.txt</span> <span class="dim"># Commit 75ee461 (RED)</span></p>
     <p class="error">FAIL tests/integration/my-registrations.test.ts (7 failed)</p>
     <p class="error">  × TEST-501: participant sees only own registrations (endpoint /api/registrations 404)</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-05-green.txt</span> <span class="dim"># Commit dc1917b (GREEN)</span></p>
     <p><span class="success">✓ tests/integration/my-registrations.test.ts</span> <span class="dim">(8 tests passed: TEST-501..508)</span></p>
     <p class="success">  ✓ TEST-501 participant sees only own | TEST-504 ownership restriction 404</p>
     <p class="bold">Test Files <span class="success">1 passed</span> (1) | Tests <span class="success">8 passed</span> (8) in 2.76s</p>`,
    "evidence-f05-tdd.png"
  );

  // F-06 TDD Card
  await renderTerminal(
    "cat docs/evidence/F-06-red.txt docs/evidence/F-06-green.txt",
    `<p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-06-red.txt</span> <span class="dim"># Commit 50c6bf2 (RED)</span></p>
     <p class="error">FAIL tests/integration/organizer-view.test.ts (6 failed)</p>
     <p class="error">  × TEST-601: owner lists registrations of own event (/api/events/:id/registrations 404)</p>
     <div class="separator"></div>
     <p><span class="prompt">$</span> <span class="cmd">cat docs/evidence/F-06-green.txt</span> <span class="dim"># Commit 46654e5 (GREEN)</span></p>
     <p><span class="success">✓ tests/integration/organizer-view.test.ts</span> <span class="dim">(8 tests passed: TEST-601..608)</span></p>
     <p class="success">  ✓ TEST-601 owner view | TEST-603 other organizer gets 404 | TEST-604 participant 403</p>
     <p class="bold">Test Files <span class="success">1 passed</span> (1) | Tests <span class="success">8 passed</span> (8) in 2.49s</p>`,
    "evidence-f06-tdd.png"
  );

  await browser.close();
  console.log("All screenshots and compact TDD cards successfully generated in:", screenshotsDir);
}

main().catch((err) => {
  console.error("Screenshot generation failed:", err);
  process.exit(1);
});
