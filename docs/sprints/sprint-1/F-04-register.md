# F-04 Register for an event — v1.0
Requirements: FR-05, BR-03, BR-04, BR-05, BR-06, NFR-01, NFR-03, R-01, R-02 | Depends on: F-01, F-02, F-03 | Owner: A | Reviewer: B

## 1. Behavior and workflow
A participant registers for a published event. The registration is created CONFIRMED for the session user. The whole decision runs in one database transaction that locks the event row (SELECT ... FOR UPDATE), so simultaneous requests are serialized. The database constraint UNIQUE(eventId, userId) is a second line of defense.

## 2. Business rules, validation, failures
Checks run in this order inside the transaction:
1. Event does not exist, or is DRAFT: 404 (D-05, BR-06).
2. startsAt is not in the future: 409 EVENT_IN_PAST (BR-05).
3. The caller already has a registration for this event, whatever its status: 409 ALREADY_REGISTERED (BR-03).
4. Number of CONFIRMED registrations >= capacity: 409 EVENT_FULL (BR-04).
5. Otherwise insert and return 201.
No waiting list in Sprint 1 (decision D-07). The request has no body; the user comes from the session.

## 3. Permissions
| Caller | POST /api/events/:id/registrations |
|---|---|
| Anonymous | 401 |
| Organizer | 403 |
| Participant | 201 or an error from section 2 |

## 4. UI
On an event page, participants see a Register button with the remaining places. While the request runs the button is disabled (loading). Success shows "You are registered" with a link to My registrations; 409 EVENT_FULL, ALREADY_REGISTERED and EVENT_IN_PAST show an error banner with the server message; 404 shows "Event not found".

## 5. API
POST /api/events/:id/registrations — no body
- 201: { "id", "eventId", "status": "CONFIRMED", "createdAt" }
- 401, 403, 404, 409 EVENT_IN_PAST, 409 ALREADY_REGISTERED, 409 EVENT_FULL.

## 6. Data
Table Registration (migration init, no new migration): id, eventId, userId, status, createdAt, UNIQUE(eventId, userId). Confirmed count is computed from this table; no separate counter that could drift.

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-401 | Participant registers for a published future event with free places | 201 CONFIRMED; row stored with userId = caller |
| AC-402 | Event at capacity | 409 EVENT_FULL; no extra row; confirmed count = capacity |
| AC-403 | Same participant registers twice | 409 ALREADY_REGISTERED; one row only |
| AC-404 | Event date in the past | 409 EVENT_IN_PAST; nothing stored |
| AC-405 | Event is a draft | 404; nothing stored |
| AC-406 | Event does not exist | 404 |
| AC-407 | Organizer calls the endpoint | 403; nothing stored |
| AC-408 | Anonymous calls the endpoint | 401; no private data |
| AC-409 | 20 simultaneous requests from 20 distinct participants for the last remaining place | Exactly one 201, nineteen 409 EVENT_FULL; confirmed count = capacity |
| AC-410 | 5 simultaneous requests from the same participant | Exactly one 201, four 409 ALREADY_REGISTERED; one row |
| AC-411 | Direct database insert of a second row for the same (eventId, userId) | Rejected by the UNIQUE constraint |
| AC-412 | Capacity N with N-1 confirmed registrations | The next participant is accepted (boundary) |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-401 | AC-402, 403, 404, 412 | Unit | Function decideRegistration({ event, now, existing, confirmedCount }) | Call with N-1/N confirmed, existing registration, past date, and with several failing conditions | OK at N-1; FULL at N; DUPLICATE; PAST; precedence PAST > DUPLICATE > FULL |
| TEST-402 | AC-401 | API/DB | Published future event, capacity 10, participant logged in | POST registration | 201 CONFIRMED; row with caller id |
| TEST-403 | AC-412 | API/DB | Capacity 3, 2 confirmed | Third participant registers | 201; confirmed count 3 |
| TEST-404 | AC-402 | API/DB | Capacity 1, 1 confirmed | Another participant registers | 409 EVENT_FULL; count still 1 |
| TEST-405 | AC-403 | API/DB | Participant already registered | Register again | 409 ALREADY_REGISTERED; one row |
| TEST-406 | AC-404 | API/DB | Published event whose date has passed (inserted directly) | Register | 409 EVENT_IN_PAST; no row |
| TEST-407 | AC-405 | API/DB | Draft event | Participant registers | 404; no row |
| TEST-408 | AC-406 | API | Random UUID | Register | 404 |
| TEST-409 | AC-407 | API/DB | Organizer logged in | Register | 403; no row |
| TEST-410 | AC-408 | API | No cookie | Register | 401; body without private data |
| TEST-411 | AC-409 | API/DB, real database | Capacity 5, 4 confirmed, 20 distinct participants | Promise.all of 20 requests | One 201, nineteen 409 EVENT_FULL; confirmed = 5 |
| TEST-412 | AC-410 | API/DB, real database | One participant | Promise.all of 5 requests | One 201, four 409 ALREADY_REGISTERED; one row |
| TEST-413 | AC-411 | DB | One registration exists | Direct SQL insert of a duplicate | UNIQUE violation |
| TEST-414 | AC-401, AC-403 | E2E | Seeded participant, published event | Register in the UI, then click Register again or reload | Success message, then ALREADY_REGISTERED error shown |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: output of TEST-411 and TEST-412 on the real database, tested commit, red then green evidence (docs/evidence/F-04-red.txt, F-04-green.txt).

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | A | Initial contract, written before implementation |

