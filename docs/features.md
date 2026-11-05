# Feature Inventory (v1.0)

Every functional requirement (FR), business rule (BR) and non-functional requirement (NFR) of the SRS is allocated to a feature or to a named system responsibility.

## 1. Features

| ID | Feature | Description | Requirements | Depends on | Sprint |
|---|---|---|---|---|---|
| F-01 | Authentication | Login with email and password, logout, current user, server-side role checks | FR-01, NFR-01, NFR-02, NFR-06 | none | 1 |
| F-02 | Create and publish an event | An organizer creates a draft (title, date, capacity) and publishes their own event if its date is in the future | FR-02, FR-03, BR-01, BR-02, BR-07 | F-01 | 1 |
| F-03 | Browse published events | An authenticated user lists and opens published events; drafts are invisible to participants | FR-04, BR-06 | F-01, F-02 | 1 |
| F-04 | Register for an event | A participant registers for a published event; capacity, duplicate and past-event rules; safe under concurrent requests | FR-05, BR-03, BR-04, BR-05, NFR-03 | F-01, F-02, F-03 | 1 |
| F-05 | My registrations | A participant lists and opens their own registrations only | FR-06, BR-09 | F-04 | 1 |
| F-06 | Organizer view of registrations | An organizer lists the registrations of their own event | FR-06, BR-07 | F-02, F-04 | 1 |
| F-07 | Cancel a registration | A participant cancels their registration; the place is released | FR-07, BR-03 | F-04 | 2 |
| F-08 | Waiting list | When an event is full, a participant joins a waiting list limited to floor(20% of capacity); promotion in order of arrival | FR-08, BR-08 | F-07 | 2 |
| F-09 | Edit an event | An organizer edits title, date and capacity of their own event (question Q-01 on capacity reduction) | FR-09, BR-01, BR-07 | F-02 | 2 |
| F-10 | Registration deadline | An organizer sets a deadline per event; registration after it is rejected | FR-10 | F-02, F-04 | 2 |
| F-11 | Check-in | An organizer records the check-in of a registered participant | FR-11, BR-07 | F-04 | 3 |
| F-12 | Attendance report | An organizer views the attendance report of their own event | FR-12, BR-07 | F-11 | 3 |

## 2. Cross-cutting system responsibilities

| ID | Responsibility | Requirements | Established and verified |
|---|---|---|---|
| R-01 | Backend authorization (session check, role check, ownership check) applied to every protected endpoint | NFR-01, BR-07, BR-09 | Established in F-01 (Sprint 1), re-verified for each new endpoint |
| R-02 | Database integrity: constraints and migrations | BR-01, BR-03, BR-04 | Sprint 1 |
| R-03 | Reproducible setup: seed data, environment configuration, no secrets in Git | NFR-04, NFR-05 | Sprint 1 |
| R-04 | Safe error handling: uniform error format, no internal details leaked | NFR-07 | Sprint 1, regression in Sprint 3 |

## 3. Coverage check

| Requirement | Covered by |
|---|---|
| FR-01 | F-01 |
| FR-02, FR-03 | F-02 |
| FR-04 | F-03 |
| FR-05 | F-04 |
| FR-06 | F-05 (participant), F-06 (organizer) |
| FR-07 | F-07 |
| FR-08 | F-08 |
| FR-09 | F-09 |
| FR-10 | F-10 |
| FR-11 | F-11 |
| FR-12 | F-12 |
| BR-01 | F-02, F-09, R-02 |
| BR-02 | F-02 |
| BR-03 | F-04, F-07, R-02 |
| BR-04 | F-04, R-02 |
| BR-05 | F-04 |
| BR-06 | F-03 |
| BR-07 | F-02, F-06, F-09, F-11, F-12, R-01 |
| BR-08 | F-08 |
| BR-09 | F-05, R-01 |
| NFR-01 | R-01 (all features) |
| NFR-02 | F-01 |
| NFR-03 | F-04, R-02 |
| NFR-04 | R-03 |
| NFR-05 | R-03 |
| NFR-06 | F-01 |
| NFR-07 | R-04 |

Uncovered requirements: none.
Approved changes: none at this version.
