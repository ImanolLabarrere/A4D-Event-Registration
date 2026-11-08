# F-06 Organizer view of registrations — v1.0
Requirements: FR-06, BR-07, NFR-01, NFR-07, R-01 | Depends on: F-02, F-04 | Owner: B | Reviewer: A

## 1. Behavior and workflow
An organizer opens one of their own events and lists its registrations, with the participants' emails and the number of confirmed places. This is the organizer side of FR-06 (the participant side is F-05). Another organizer's event is indistinguishable from a non-existent one (D-08).

## 2. Business rules, validation, failures
- Only the organizer who owns the event may list its registrations (BR-07). The event may be a draft (the list is then empty).
- Registrations are ordered by createdAt ascending. Only registrations of the requested event are returned.
- Each registration exposes the participant's id and email (the organizer needs to know who registered) and nothing else about the participant: no password hash, role or session data (NFR-07).
- A non-owner organizer, an unknown id and a malformed id all return the same 404 body.
- Participants get 403 and anonymous callers get 401, without any registration data.

## 3. Permissions
| Caller | GET /api/events/:id/registrations |
|---|---|
| Anonymous | 401 |
| Participant | 403 |
| Organizer, owner | 200 |
| Organizer, not owner | 404 |
| Any organizer, unknown or malformed id | 404 |

## 4. UI
Page "Event registrations", opened from the organizer's My events page: header with the event title, date and "confirmed / capacity" (for example 3 / 5); loading indicator; empty state ("No registration yet"); error state; table with participant email, status and registration date. A 404 shows "Event not found". Hiding the page from participants is cosmetic; the backend enforces the role and ownership.

## 5. API
GET /api/events/:id/registrations — no body
- 200: { "event": { "id", "title", "startsAt", "capacity" }, "confirmedCount": number, "registrations": [ { "id", "status", "createdAt", "participant": { "id", "email" } } ] }
- 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 NOT_FOUND.

## 6. Data
No schema change. Read-only on Registration joined with User (id, email) and Event.

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-601 | The owner lists the registrations of their event | 200 with every registration of that event, ordered by creation date, and the correct confirmedCount |
| AC-602 | The owner lists an event with no registration | 200, an empty list and confirmedCount 0 |
| AC-603 | Another organizer requests the event | 404; no participant data in the body |
| AC-604 | A participant requests the endpoint | 403; no participant data in the body |
| AC-605 | An anonymous caller requests the endpoint | 401; no private data |
| AC-606 | Unknown or malformed event id | 404 with the same body as AC-603 |
| AC-607 | The owner has two events with registrations | Each list contains only the registrations of its own event |
| AC-608 | Any successful response | The participant object contains only id and email: no passwordHash, role or session data |
| AC-609 | A participant registers through F-04 | The registration then appears in the owner's list (cross-feature check) |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-601 | AC-601 | API/DB | Event with 3 registrations from 3 participants | Owner GET | 200; 3 entries with the right participants, ordered by createdAt; confirmedCount 3 |
| TEST-602 | AC-602 | API/DB | Event with no registration | Owner GET | 200; empty list; confirmedCount 0 |
| TEST-603 | AC-603 | API/DB | Event of organizer 1 with registrations | Organizer 2 GET | 404; body has no email |
| TEST-604 | AC-604 | API/DB | Event with registrations | Participant GET | 403; body has no email |
| TEST-605 | AC-605 | API | No cookie | GET | 401; no private data |
| TEST-606 | AC-606 | API | Logged-in organizer | GET with a random UUID and with "abc" | 404 both, same body as TEST-603 |
| TEST-607 | AC-607 | API/DB | Two events of the same organizer, each with its own registrations | GET each | Each list contains only its own event's registrations |
| TEST-608 | AC-608 | API | Event with registrations | Owner GET; inspect the keys of each participant object | Only id and email; no passwordHash, role or session key |
| TEST-609 | AC-609 | API/DB | Published future event, logged-in participant | Participant POST registration (F-04), then owner GET | The new registration appears; confirmedCount 1 (runs at sprint integration, after F-04) |
| TEST-610 | AC-601, AC-609 | E2E | Seeded organizer and participant | Participant registers; organizer opens the event registrations page | The participant's email is listed and the header shows the count |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: test output, tested commit, TEST-to-file mapping, red then green evidence (docs/evidence/F-06-red.txt, F-06-green.txt). TEST-603 and TEST-604 are the candidates for the ownership and role excerpts.

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | B | Initial contract, written before implementation |
