# Product Definition of Done — v1.0

A Sprint 1 feature is done only when all points are met and supported by evidence (not by an AI agent's statement):
1. Required behavior is implemented as described in its contract (UI, API and data where applicable).
2. Every planned test of the STS is implemented and executed; each AC maps to at least one passing automated test, and negative, boundary and role cases are included.
3. For rule work, the intended-behavior test was seen failing before the implementation and passing after (output saved in docs/evidence/).
4. Authorization is enforced by the backend; no client-selected user id or role is trusted.
5. Error responses follow D-08 and contain no stack trace, SQL or password hash.
6. The change was made on a feature branch from sprint-1, reviewed by the other student in a PR with a specific check or finding, and merged into sprint-1; authors never approve their own PR.
7. Integration tests and acceptance checks pass on sprint-1; the reviewed release PR sprint-1 to main is merged and tagged (v0.1.0-sprint1).
8. README, contracts, traceability and .env.example are current; no secret is committed.
9. Test command, counts (passed, failed, skipped), and the tested commit are recorded. Failed or skipped tests and incomplete work are disclosed; no required test is disabled or weakened.

