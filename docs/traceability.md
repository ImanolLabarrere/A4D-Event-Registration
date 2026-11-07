# Requirements Traceability (v1.0)

Each Sprint 1 feature owns a range of acceptance criteria and tests: F-01 AC-1xx/TEST-1xx, F-02 AC-2xx/TEST-2xx, F-03 AC-3xx/TEST-3xx, F-04 AC-4xx/TEST-4xx, F-05 AC-5xx/TEST-5xx, F-06 AC-6xx/TEST-6xx. Exact IDs are in the feature contracts (docs/sprints/sprint-1/). Features of Sprints 2 and 3 get their AC and tests in their own contract before implementation.

## 1. Functional requirements
| Requirement | Feature | Sprint | Verification |
|---|---|---|---|
| FR-01 | F-01 Authentication | 1 | AC-101..114 / TEST-101..114 (contract F-01) |
| FR-02 | F-02 Create and publish an event | 1 | AC-201..203, 213 / TEST-203..205, 215, 216 |
| FR-03 | F-02 Create and publish an event | 1 | AC-206..211 / TEST-208..213, 216 |
| FR-04 | F-03 Browse published events | 1 | AC-301..313 / TEST-301..314 (contract F-03) |
| FR-05 | F-04 Register for an event | 1 | AC-401..412 / TEST-401..414 |
| FR-06 | F-05 My registrations; F-06 Organizer view | 1 | AC-501..508 / TEST-501..509; AC-601..609 / TEST-601..610 |
| FR-07 | F-07 Cancel a registration | 2 | Contract at Sprint 2 |
| FR-08 | F-08 Waiting list | 2 | Contract at Sprint 2 |
| FR-09 | F-09 Edit an event | 2 | Contract at Sprint 2 |
| FR-10 | F-10 Registration deadline | 2 | Contract at Sprint 2 |
| FR-11 | F-11 Check-in | 3 | Contract at Sprint 3 |
| FR-12 | F-12 Attendance report | 3 | Contract at Sprint 3 |

## 2. Business rules
| Requirement | Feature or responsibility | Sprint | Verification |
|---|---|---|---|
| BR-01 | F-02, R-02 | 1 | AC-202, AC-212 / TEST-201, 204, 214 |
| BR-02 | F-02 | 1 | AC-207 / TEST-202, 209 |
| BR-03 | F-04, R-02 (extended by F-07 in Sprint 2) | 1 | AC-403, AC-410, AC-411 / TEST-401, 405, 412, 413 |
| BR-04 | F-04, R-02 | 1 | AC-402, AC-409, AC-412 / TEST-401, 403, 404, 411 |
| BR-05 | F-04 | 1 | AC-404 / TEST-401, 406 |
| BR-06 | F-03; F-04 (draft returns 404) | 1 | AC-302..305 / TEST-302, 305, 306; AC-405 / TEST-407 |
| BR-07 | F-02, F-06, R-01 | 1 | AC-209 / TEST-211; AC-601..607 / TEST-601..607 |
| BR-08 | F-08 | 2 | Contract at Sprint 2 |
| BR-09 | F-05, R-01 | 1 | AC-501, AC-504, AC-505 / TEST-501, 504, 505 |

## 3. Non-functional requirements
| Requirement | Feature or responsibility | Sprint | Verification |
|---|---|---|---|
| NFR-01 | R-01 (all protected endpoints) | 1 | AC-106, 111, AC-205, 210, AC-306, 308, AC-408, AC-506, 507, AC-604, 605 / TEST-102, 109, 207, 212, 307, 309, 410, 506, 507, 604, 605 |
| NFR-02 | F-01 | 1 | AC-110 / TEST-112 (argon2id hash check) |
| NFR-03 | F-04, R-02 | 1 | AC-409 / TEST-411 (real database, 20 concurrent requests) |
| NFR-04 | R-03 | 1 | Manual before/after count procedure, documented in Part F |
| NFR-05 | R-03 | 1 | Release check: git ls-files shows no .env |
| NFR-06 | F-01 | 1 | AC-108, 109 / TEST-103, 111 (8h TTL, delete on expiry) |
| NFR-07 | R-04 | 1 | AC-508 / TEST-508; error-body checks in each feature contract |

## 4. Coverage gaps
None: every FR, BR and NFR has a feature or system responsibility and a sprint. All Sprint 1 AC and test IDs are fully mapped and verified.

## 5. Approved changes
None at this version.
