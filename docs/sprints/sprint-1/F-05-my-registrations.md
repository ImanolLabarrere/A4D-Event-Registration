# F-05 My registrations — v1.0
Requirements: FR-06, BR-09, NFR-01, NFR-07, R-01 | Depends on: F-04 | Owner: A | Reviewer: B

## 1. Behavior and workflow
A participant lists their own registrations and opens one of them. A registration of another participant is indistinguishable from a non-existent one (D-08).

## 2. Business rules, validation, failures
- The list contains only registrations whose userId is the session user, newest first. Empty list returns 200 with [].
- Opening a registration that does not exist, is malformed, or belongs to someone else returns the same 404 body.
- Responses never contain emails, password hashes, or other users' ids (NFR-07).

## 3. Permissions
| Caller | GET /api/registrations | GET /api/registrations/:id |
|---|---|---|
| Anonymous | 401 | 401 |
| Organizer | 403 | 403 |
| Participant | 200 own | 200 own, 404 otherwise |

## 4. UI
"My registrations" page: loading indicator, empty state ("You have no registrations yet"), error state, and a list with event title, date and status; each row opens the detail view. A 404 on the detail view shows "Registration not found".

## 5. API
GET /api/registrations — 200: [ { "id", "eventId", "eventTitle", "eventStartsAt", "status", "createdAt" } ]
GET /api/registrations/:id — 200: same shape; 404 NOT_FOUND.
Both: 401 and 403 as in section 3.

## 6. Data
No schema change. Read-only on Registration joined with Event.

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-501 | Two participants each have registrations | Each list contains only the caller's registrations |
| AC-502 | Participant with no registration | 200 and an empty list |
| AC-503 | Participant opens their own registration after registering | 200 with the stored data (retrieval of the persisted result) |
| AC-504 | Participant opens another participant's registration id | 404, no registration data in the body |
| AC-505 | Participant opens a non-existent id | 404 with a body identical to AC-504 |
| AC-506 | Organizer calls either endpoint | 403 |
| AC-507 | Anonymous calls either endpoint | 401, no private data |
| AC-508 | Any successful response | No email, passwordHash, or other users' ids in the body |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-501 | AC-501 | API/DB | P1 has 2 registrations, P2 has 1 | P1 lists; P2 lists | P1 sees 2 own only; P2 sees 1 own only |
| TEST-502 | AC-502 | API | Participant without registration | GET list | 200, [] |
| TEST-503 | AC-503 | API/DB | P1 registers via F-04 | GET detail with returned id | 200; eventId, status, createdAt match the stored row |
| TEST-504 | AC-504 | API/DB | Registration owned by P2 | P1 GET detail | 404; body has no eventTitle or userId |
| TEST-505 | AC-505 | API | Random UUID | GET detail | 404; body equal to TEST-504 body |
| TEST-506 | AC-506 | API | Organizer logged in | GET list and detail | 403 both |
| TEST-507 | AC-507 | API | No cookie | GET list and detail | 401 both; no private data |
| TEST-508 | AC-508 | API | P1 with a registration | GET list and detail, inspect keys | No email, passwordHash or userId key in the bodies |
| TEST-509 | AC-501, AC-503 | E2E | Seeded participant | Register, open My registrations, open the detail | Registration shown, detail matches |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: TEST-504 output (ownership restriction excerpt), tested commit, red then green evidence.

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | A | Initial contract, written before implementation |

