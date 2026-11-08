# F-03 Browse published events — v1.0
Requirements: FR-04, BR-06, BR-07, NFR-01, NFR-07, R-01 | Depends on: F-01, F-02 | Owner: B | Reviewer: A

## 1. Behavior and workflow
An authenticated user lists upcoming published events and opens one. A participant never sees a draft (BR-06): a draft behaves exactly like a non-existent event. An organizer additionally lists their own events, drafts included, and can open their own drafts. Each event shows how many places remain, computed from the confirmed registrations.

## 2. Business rules, validation, failures
- GET /api/events returns only events with status PUBLISHED and startsAt in the future, ordered by startsAt ascending. Past published events are not listed (decision recorded here) but can still be opened by id.
- GET /api/events/mine returns every event owned by the caller, drafts included, ordered by startsAt ascending. Only organizers may call it.
- GET /api/events/:id: a PUBLISHED event is returned to any authenticated user. A DRAFT event is returned only to its organizer; for anyone else it is a 404 identical to an unknown id (D-05, D-08). An unknown or malformed id is a 404.
- confirmedCount is the number of CONFIRMED registrations; remainingPlaces = max(0, capacity - confirmedCount). Both are computed from the Registration table; no counter is stored.
- Responses contain no emails, password hashes, organizer identity or registration data, only the counts (NFR-07).
- The route /api/events/mine must be declared before /api/events/:id.

## 3. Permissions
| Caller | GET /api/events | GET /api/events/mine | GET /api/events/:id |
|---|---|---|---|
| Anonymous | 401 | 401 | 401 |
| Participant | 200 published | 403 | 200 if published; 404 if draft or unknown |
| Organizer | 200 published | 200 own events | 200 if published or own draft; 404 for another organizer's draft or unknown |

## 4. UI
Event list page for participants and organizers: loading indicator, empty state ("No upcoming events"), error state with retry, and one row per event with title, date and remaining places. A row opens the event detail page (title, date, capacity, remaining places; the Register button belongs to F-04). Organizer page "My events": same states, with a Draft or Published badge per event; Create and Publish actions belong to F-02. A 404 on the detail page shows "Event not found".

## 5. API
GET /api/events — 200: [ { "id", "title", "startsAt", "capacity", "confirmedCount", "remainingPlaces", "status" } ]
GET /api/events/mine — 200: same shape.
GET /api/events/:id — 200: same shape; 404 NOT_FOUND.
All: 401 UNAUTHENTICATED; /mine: 403 FORBIDDEN for a participant.

## 6. Data
No schema change. Read-only on Event with a count of CONFIRMED Registration rows.

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-301 | A participant lists events | Only PUBLISHED events with a future date, ordered by date ascending |
| AC-302 | A draft event exists | It never appears in GET /api/events, for a participant or an organizer |
| AC-303 | A participant opens a draft event by id | 404, no event data in the body |
| AC-304 | An organizer opens another organizer's draft | 404, no event data in the body |
| AC-305 | An organizer opens their own draft | 200 with the event |
| AC-306 | An anonymous caller uses any of the three endpoints | 401, no private data |
| AC-307 | An organizer calls GET /api/events/mine | Own events including drafts, none of another organizer's |
| AC-308 | A participant calls GET /api/events/mine | 403, no event data |
| AC-309 | Capacity 2 with 1 then 2 confirmed registrations | confirmedCount 1 and remainingPlaces 1, then 2 and 0 |
| AC-310 | No upcoming published event | 200 and an empty list |
| AC-311 | Unknown or malformed event id | 404 |
| AC-312 | A published event whose date has passed | Absent from the list, but 200 when opened by id |
| AC-313 | Any successful response | No email, passwordHash, userId, organizerId or registration entries; only the counts |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-301 | AC-309 | Unit | Function computeRemainingPlaces(capacity, confirmed) | Call with (5, 0), (5, 5), (5, 6) | 5, 0, 0 |
| TEST-302 | AC-301, AC-302, AC-312 | API/DB | One future published event, one draft, one past published event | Participant GET /api/events | Only the future published event is returned |
| TEST-303 | AC-301 | API/DB | Three future published events inserted out of order | Participant GET /api/events | Ordered by startsAt ascending |
| TEST-304 | AC-310 | API/DB | No published event | Participant GET /api/events | 200 and [] |
| TEST-305 | AC-303 | API/DB | Draft event | Participant GET /api/events/:id | 404; body has no title |
| TEST-306 | AC-304, AC-305 | API/DB | Draft owned by organizer 2 | Organizer 1 GET it; organizer 2 GET it | 404; then 200 |
| TEST-307 | AC-306 | API | No cookie | GET /api/events, /api/events/mine, /api/events/:id | 401 each; no private data |
| TEST-308 | AC-307 | API/DB | Organizers 1 and 2 each own a draft and a published event | Organizer 1 GET /api/events/mine | Own 2 events only |
| TEST-309 | AC-308 | API | Participant logged in | GET /api/events/mine | 403; no event data |
| TEST-310 | AC-309 | API/DB | Capacity 2; registrations inserted directly in the database (does not depend on F-04) | GET /api/events/:id with 1 then 2 confirmed rows | confirmedCount 1 and remainingPlaces 1; then 2 and 0 |
| TEST-311 | AC-311 | API | Logged-in participant | GET /api/events/ with a random UUID and with "abc" | 404 both |
| TEST-312 | AC-312 | API/DB | Published event dated yesterday | GET list; GET by id | Not in the list; 200 by id |
| TEST-313 | AC-313 | API/DB | Event with a confirmed registration | GET list and detail; inspect keys | No email, passwordHash, userId, organizerId or registrations key |
| TEST-314 | AC-301, AC-302 | E2E | Seeded participant | Log in, open the event list, open an event | Published events shown, no draft; detail page shows the remaining places |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: test output, tested commit, TEST-to-file mapping, red then green evidence (docs/evidence/F-03-red.txt, F-03-green.txt).

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | B | Initial contract, written before implementation |
