# SRS — Event Registration and Attendance System (v1.0)

## 1. Context and problem
A university department runs workshops and talks with limited seating. Registrations are currently handled through messages or spreadsheets, which leads to duplicate sign-ups, overbooking, and no reliable view for organizers. The product lets organizers publish events with a limited capacity and lets participants register for them, with strict capacity control. Later sprints add cancellation, a waiting list, and attendance tracking.

## 2. Actors
| Actor | Responsibilities |
|---|---|
| Organizer | Creates and publishes their own events, views the registrations of their own events |
| Participant | Browses published events, registers, views their own registrations |

## 3. Scope and exclusions
Included: authentication, events, registrations, cancellation, waiting list, check-in, attendance reports.
Excluded: payments, emails and notifications, self-registration of accounts, password recovery, multiple roles per account, recurring events.

## 4. Functional requirements
| ID | Requirement | Sprint |
|---|---|---|
| FR-01 | A user logs in, logs out, and retrieves their current identity | 1 |
| FR-02 | An organizer creates an event (title, date, capacity) as a draft | 1 |
| FR-03 | An organizer publishes their own event | 1 |
| FR-04 | A participant lists published events | 1 |
| FR-05 | A participant registers for a published event | 1 |
| FR-06 | A participant views their own registrations; an organizer views the registrations of their own event | 1 |
| FR-07 | A participant cancels their registration | 2 |
| FR-08 | A participant is placed on a waiting list when the event is full, then promoted in order of arrival | 2 |
| FR-09 | An organizer edits their event (title, date, capacity) | 2 |
| FR-10 | A registration deadline can be set per event | 2 |
| FR-11 | An organizer records participant check-in | 3 |
| FR-12 | An organizer views an attendance report | 3 |

## 5. Business rules
| ID | Rule | Sprint |
|---|---|---|
| BR-01 | Capacity is a strictly positive integer | 1 |
| BR-02 | An event can only be published if its date is in the future | 1 |
| BR-03 | A participant has at most one registration per event, permanently: no re-registration after cancellation | 1 |
| BR-04 | The number of confirmed registrations never exceeds the capacity, even with simultaneous requests | 1 |
| BR-05 | Registration for a past event is not allowed | 1 |
| BR-06 | An unpublished event is invisible to participants | 1 |
| BR-07 | An organizer can only manage their own events | 1 |
| BR-08 | The waiting list is limited to floor(20% of capacity); an event with fewer than 5 places has no waiting list | 2 |
| BR-09 | A participant can only see their own registrations | 1 |

## 6. Non-functional requirements
| ID | Requirement and measurable target | Verification method | Established / verified |
|---|---|---|---|
| NFR-01 | Any request to a protected endpoint without a valid session returns 401 and a body that contains no private data (no draft, no registration, no user data) | API test calling every protected endpoint without a cookie | Sprint 1 / Sprint 1, re-run in each later sprint |
| NFR-02 | Passwords are stored only as argon2id hashes; no plaintext password exists in the database | Integration test: the stored hash starts with `$argon2id$` and differs from the password | Sprint 1 / Sprint 1 |
| NFR-03 | With 20 simultaneous registration requests from 20 distinct participants for the last remaining place, exactly 1 request succeeds (201), 19 receive 409 EVENT_FULL, and confirmed registrations equal the capacity | Integration test on the real PostgreSQL database with `Promise.all` (no mock) | Sprint 1 / Sprint 1 |
| NFR-04 | Data survives a restart: the number of events and registrations after restarting the API and the database container equals the number before | Documented manual procedure with before/after counts (Sprint 1); repeated after redeployment on GCP (Lab 5) | Sprint 1 / Sprint 1 and Lab 5 |
| NFR-05 | No secret is stored in Git: `.env` is not tracked, `.env.example` contains placeholders only | Release check: `git ls-files` lists no `.env`; manual review of `.env.example` | Sprint 1 / Sprint 1 |
| NFR-06 | A session expires after 8 hours; an expired or logged-out session cookie is rejected with 401 | Integration test: set `expiresAt` in the past, then call `/api/auth/me`; call `/api/auth/me` with the cookie of a logged-out session | Sprint 1 / Sprint 1 |
| NFR-07 | Error responses never contain a stack trace, SQL text or password hash | API test: provoke validation and server errors and inspect the response bodies | Sprint 1 / Sprint 3 regression |

## 7. Assumptions, decisions, questions
| ID | Decision | Rationale |
|---|---|---|
| D-01 | No re-registration after cancellation | UNIQUE(event, user) constraint across all statuses |
| D-02 | Waiting list = 20% of places, rounded down, in Sprint 2 | Promotion requires cancellation (Sprint 2) |
| D-03 | Registration is rejected if the event is in the past | Business consistency |
| D-04 | An organizer manages only their own events | Default option of the brief |
| D-05 | A draft event is invisible to participants (404) | Avoids information leakage |
| D-06 | Server-side sessions, httpOnly cookie, 8 h expiry | Logout truly revokes the session |
| D-07 | Full event in Sprint 1: 409 EVENT_FULL response | Waiting list deferred to Sprint 2 |

Open questions:
| ID | Question | Resolution |
|---|---|---|
| Q-01 | What happens if an organizer reduces capacity below the number of registered participants? | To be decided before Sprint 2 (proposal: reject the reduction) |


### Additional assumptions (B)
| ID | Assumption |
|---|---|
| A-01 | All dates are stored in UTC and displayed in the user's local time |
| A-02 | An event has exactly one organizer; co-organizers are out of scope |
| A-03 | Accounts are created by the seed only; there is no self-registration |
| A-04 | Event title is 1 to 120 characters; capacity is an integer from 1 to 1000 |
| A-05 | The email is the login identifier and is compared in lower case |
| A-06 | In Sprint 1 a published event cannot be unpublished |
| A-07 | All demo data is synthetic |

### Additional decisions (B)
| ID | Decision | Rationale |
|---|---|---|
| D-08 | Error convention: 401 when not authenticated, 403 when the role is not allowed, 404 when the resource does not exist or does not belong to the caller (another participant's registration, a draft seen by a participant, another organizer's event), 409 for state conflicts (EVENT_FULL, ALREADY_REGISTERED, EVENT_IN_PAST, ALREADY_PUBLISHED), 400 for invalid input | One rule for every contract; a 404 does not reveal that a private resource exists |
| D-09 | A failed login always returns the same message and 401, whether the email or the password is wrong | Does not reveal which emails exist |
| D-10 | Only the PARTICIPANT role can register; an organizer who tries receives 403 | Matches the permission matrix and the stakeholder brief |
| D-11 | The event list requires authentication; anonymous users cannot list events | Matches the permission matrix and NFR-01 |
