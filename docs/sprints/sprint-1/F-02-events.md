# F-02 Create and publish an event — v1.0
Requirements: FR-02, FR-03, BR-01, BR-02, BR-07, NFR-01, NFR-07, R-01, R-02 | Depends on: F-01 | Owner: A | Reviewer: B

## 1. Behavior and workflow
An authenticated organizer creates an event in DRAFT status (title, start date, capacity). The event belongs to the organizer identified by the session. The organizer then publishes it. Only published events are visible to and registrable by participants (BR-06, verified in F-03 and F-04). Publishing is one-way in Sprint 1 (no unpublish).

## 2. Business rules, validation, failures
- title: string, 1 to 120 characters after trimming.
- startsAt: valid ISO 8601 date-time. Any date is accepted at creation; BR-02 is checked at publication.
- capacity: integer, 1 to 10000 (BR-01; the upper bound is an assumption recorded here). Zero, negative, decimal, string or missing values return 400 VALIDATION_ERROR.
- Fields id, status and organizerId sent in the body are ignored; the owner is always the session user.
- Publish checks, in this order: event exists and belongs to the caller (else 404); status is DRAFT (else 409 ALREADY_PUBLISHED); startsAt is in the future (else 409 EVENT_IN_PAST).
- Error body follows D-08 and SDS 4.2: { "error": { "code", "message" } }. No stack trace or SQL.

## 3. Permissions
| Caller | POST /api/events | POST /api/events/:id/publish |
|---|---|---|
| Anonymous | 401 | 401 |
| Participant | 403 | 403 |
| Organizer, owner | 201 | 200 |
| Organizer, not owner | n/a | 404 |

## 4. UI
Organizer page "New event": form with title, date-time and capacity; Create button disabled while the request runs (loading state); field-level messages for 400. After creation the draft is shown with a Publish button; after publication a "Published" badge replaces it. A 409 is shown as an error banner with the server message. Hiding the page from participants is cosmetic: the backend enforces the role.

## 5. API
POST /api/events — body: { "title": string, "startsAt": ISO date-time, "capacity": integer }
- 201: { "id", "title", "startsAt", "capacity", "status": "DRAFT", "organizerId" }
- 400 VALIDATION_ERROR, 401, 403.

POST /api/events/:id/publish — no body
- 200: same event shape with "status": "PUBLISHED"
- 401, 403, 404 (absent, malformed id, or not owned), 409 ALREADY_PUBLISHED, 409 EVENT_IN_PAST.

## 6. Data
Table Event (migration init, no new migration): id, title, startsAt, capacity, status (DRAFT/PUBLISHED), organizerId. Constraint capacity_positive (CHECK capacity > 0).

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-201 | Organizer creates a valid event | 201, status DRAFT, organizerId = caller, event retrievable from the database |
| AC-202 | Capacity 0, -1, 1.5, "10" or missing | 400 VALIDATION_ERROR, nothing stored |
| AC-203 | Empty title or invalid date | 400 VALIDATION_ERROR, nothing stored |
| AC-204 | Participant creates an event | 403, nothing stored |
| AC-205 | Anonymous creates an event | 401, no private data in the body |
| AC-206 | Organizer publishes their own draft with a future date | 200, status PUBLISHED, persisted |
| AC-207 | Publish an event whose date is not in the future | 409 EVENT_IN_PAST, status stays DRAFT |
| AC-208 | Publish an already published event | 409 ALREADY_PUBLISHED, no change |
| AC-209 | Organizer publishes another organizer's event | 404, status unchanged |
| AC-210 | Participant publishes an event | 403, status unchanged |
| AC-211 | Publish a non-existent or malformed id | 404 |
| AC-212 | Direct database insert with capacity <= 0 | Rejected by constraint capacity_positive |
| AC-213 | Body contains organizerId or status PUBLISHED | Ignored: event is DRAFT and owned by the caller |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-201 | AC-202 | Unit | Schema createEventSchema | Validate capacity 0, -1, 1.5, "10", missing | Each rejected; capacity 1 and 10000 accepted |
| TEST-202 | AC-207 | Unit | Function canPublish(event, now) | now equal to or after startsAt; now one second before | false, then true |
| TEST-203 | AC-201 | API/DB | Logged-in organizer | POST valid event | 201 DRAFT; row exists with organizerId |
| TEST-204 | AC-202 | API/DB | Logged-in organizer, event count N | POST capacity 0 | 400; count still N |
| TEST-205 | AC-203 | API | Logged-in organizer | POST empty title; POST "not-a-date" | 400 both |
| TEST-206 | AC-204 | API/DB | Logged-in participant | POST valid event | 403; count unchanged |
| TEST-207 | AC-205 | API | No cookie | POST valid event | 401; body has no private data |
| TEST-208 | AC-206 | API/DB | Own draft, future date | POST publish | 200; row status PUBLISHED |
| TEST-209 | AC-207 | API/DB | Own draft, past date | POST publish | 409 EVENT_IN_PAST; status DRAFT |
| TEST-210 | AC-208 | API | Own published event | POST publish | 409 ALREADY_PUBLISHED |
| TEST-211 | AC-209 | API/DB | Draft owned by organizer 2, caller organizer 1 | POST publish | 404; status DRAFT |
| TEST-212 | AC-210 | API/DB | Logged-in participant, existing draft | POST publish | 403; status DRAFT |
| TEST-213 | AC-211 | API | Logged-in organizer | POST publish unknown id and "abc" | 404 both |
| TEST-214 | AC-212 | DB | Direct SQL insert | Insert capacity 0 | Constraint violation |
| TEST-215 | AC-213 | API/DB | Logged-in organizer | POST with organizerId of another user and status PUBLISHED | 201; DRAFT; organizerId = caller |
| TEST-216 | AC-201, AC-206 | E2E | Seeded organizer | Create then publish through the UI | Draft then Published badge; event persists after reload |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: test output, tested commit, TEST-to-file mapping, red then green evidence (docs/evidence/F-02-red.txt, F-02-green.txt).

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | A | Initial contract, written before implementation |
