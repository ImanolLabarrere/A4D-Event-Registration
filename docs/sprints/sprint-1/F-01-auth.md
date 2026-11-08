# F-01 Authentication — v1.0
Requirements: FR-01, NFR-01, NFR-02, NFR-06, NFR-07, R-01, R-04 | Depends on: none | Owner: B | Reviewer: A

## 1. Behavior and workflow
A user logs in with email and password. The server creates a session row with a random token and sends it in an httpOnly cookie. Every protected request is authenticated from that cookie. The user can retrieve their identity and log out, which deletes the session. Accounts come from the seed (no self-registration, A-03). The feature also provides the shared middlewares requireAuth and requireRole(...roles) used by all later features (R-01).

## 2. Business rules, validation, failures
- email: string, trimmed and lower-cased before lookup, 1 to 254 characters (A-05). password: string, 1 to 200 characters. Anything else returns 400 VALIDATION_ERROR.
- A wrong password and an unknown email return the same 401 INVALID_CREDENTIALS with the same body (D-09). No cookie is set on failure.
- Token: 32 random bytes from a cryptographic generator, hexadecimal (64 characters). Session lifetime: SESSION_TTL_HOURS (8 hours, NFR-06).
- Cookie: name sid, HttpOnly, SameSite=Lax, Path=/, Secure when NODE_ENV=production.
- requireAuth: missing, unknown or expired cookie returns 401 UNAUTHENTICATED; an expired session row is deleted. requireRole: authenticated but role not allowed returns 403 FORBIDDEN.
- Identity and role come only from the session. Any userId, role or similar value in the body, query or headers is ignored.
- Logout deletes the session row and clears the cookie; it is idempotent (204 even without a session).
- Passwords are stored only as argon2id hashes (NFR-02). A passwordHash is never returned or logged.
- Error body follows D-08 and SDS 4.2: { "error": { "code", "message" } }, with no stack trace or SQL (NFR-07).

## 3. Permissions
| Endpoint | Anonymous | Participant | Organizer |
|---|---|---|---|
| POST /api/auth/login | allowed | allowed | allowed |
| POST /api/auth/logout | 204 | 204 | 204 |
| GET /api/auth/me | 401 | 200 | 200 |

## 4. UI
Login page: email and password fields, Log in button disabled while the request runs (loading state), one generic error message on 401, field messages on 400. After login the navigation depends on the role returned by /api/auth/me (participant: events and My registrations; organizer: My events). A Log out button is always visible when logged in. When any request returns 401, the user is sent back to the Login page. Hiding navigation is cosmetic; the backend enforces every permission.

## 5. API
POST /api/auth/login — body: { "email": string, "password": string }
- 200: { "id", "email", "role" } and Set-Cookie: sid=...
- 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS.

POST /api/auth/logout — no body
- 204 and a cleared sid cookie.

GET /api/auth/me — no body
- 200: { "id", "email", "role" }
- 401 UNAUTHENTICATED.

Shared error codes: UNAUTHENTICATED (401), FORBIDDEN (403), NOT_FOUND (404), VALIDATION_ERROR (400).

## 6. Data
Tables User and Session (migration init, no new migration). Session: id (token), userId, expiresAt, cascade delete with the user. No schema change.

## 7. Acceptance criteria
| AC | Criterion | Observable outcome |
|---|---|---|
| AC-101 | Login with a valid email and password | 200 with id, email, role; sid cookie set; a Session row exists for the user |
| AC-102 | Login with a wrong password | 401 INVALID_CREDENTIALS; no cookie; no Session row created |
| AC-103 | Login with an unknown email | Same status and same body as AC-102 |
| AC-104 | Login with a missing, empty or non-string email or password | 400 VALIDATION_ERROR; no Session row created |
| AC-105 | GET /api/auth/me with a valid cookie | 200 with the identity and role of the session user |
| AC-106 | GET /api/auth/me without a cookie | 401 UNAUTHENTICATED; no private data in the body |
| AC-107 | Logout, then reuse the old cookie | Logout 204 and the Session row is deleted; the old cookie gets 401 on /api/auth/me; a second logout also returns 204 |
| AC-108 | Session whose expiresAt is in the past | 401 on /api/auth/me and the expired row is deleted |
| AC-109 | Session cookie and token properties | Cookie is HttpOnly, SameSite=Lax, Path=/; token is 64 hexadecimal characters; expiresAt is about 8 hours after login |
| AC-110 | Password storage and responses | Stored passwordHash starts with $argon2id$ and differs from the password; no response contains passwordHash |
| AC-111 | Role check middleware | Unauthenticated request gets 401; authenticated request with a role outside the allowed list gets 403; allowed role passes |
| AC-112 | Request carries userId, role, X-User-Role header or a query parameter | Ignored: /api/auth/me still returns the session user's own identity |
| AC-113 | Login with the email in upper case or with surrounding spaces | Succeeds as for the lower-case email |
| AC-114 | Garbage or unknown cookie value | 401 UNAUTHENTICATED |

## 8. Software Test Specification
| TEST | AC | Level | Precondition / input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-101 | AC-109 | Unit | Function generateSessionToken | Generate 1000 tokens | Each is 64 hexadecimal characters; all distinct |
| TEST-102 | AC-111 | Unit | requireRole with fake request and response objects | No user; user with a non-allowed role; user with an allowed role | 401; 403; next() called |
| TEST-103 | AC-101, AC-109 | API/DB | Seeded organizer | POST login with valid credentials | 200 with id, email, role; Set-Cookie has sid, HttpOnly, SameSite=Lax, Path=/; Session row exists with expiresAt within 8 hours (tolerance 1 minute) |
| TEST-104 | AC-102 | API/DB | Seeded organizer, Session count N | POST login with a wrong password | 401 INVALID_CREDENTIALS; no Set-Cookie; count still N |
| TEST-105 | AC-103 | API | Unknown email | POST login | Same status and body as TEST-104 |
| TEST-106 | AC-104 | API/DB | Session count N | POST login with no body, empty strings, numbers | 400 VALIDATION_ERROR each; count still N |
| TEST-107 | AC-113 | API | Seeded participant | POST login with upper-case email and spaces around it | 200 |
| TEST-108 | AC-105 | API | Logged-in participant | GET /api/auth/me with the cookie | 200; id, email and role match the seeded user |
| TEST-109 | AC-106, AC-114 | API | No cookie; cookie "sid=garbage" | GET /api/auth/me | 401 both; body has no email, role or id |
| TEST-110 | AC-107 | API/DB | Logged-in user | POST logout, GET /api/auth/me with the old cookie, POST logout again | 204; Session row deleted; 401; 204 |
| TEST-111 | AC-108 | API/DB | Session whose expiresAt is set in the past | GET /api/auth/me | 401; Session row deleted |
| TEST-112 | AC-110 | DB/API | Seeded users | Read User.passwordHash from the database; inspect login and me bodies | Starts with $argon2id$; differs from SEED_PASSWORD; no passwordHash key in any response |
| TEST-113 | AC-112 | API | Logged-in participant | GET /api/auth/me with header X-User-Role: ORGANIZER and query ?userId=other | Identity and role remain those of the participant |
| TEST-114 | AC-101, AC-105, AC-107 | E2E | Seeded organizer | Log in through the UI, see the organizer navigation, log out, reload; then call the API with the old cookie | Login page shown after logout and reload; API returns 401 |

## 9. Completion evidence
Command: npm test and npm run test:e2e. Recorded in Part F: test output, tested commit, TEST-to-file mapping, red then green evidence (docs/evidence/F-01-red.txt, F-01-green.txt) and the TEST-110 and TEST-112 results as proof for NFR-06 and NFR-02.

## Revision history
| Version | Date | Author | Justification |
|---|---|---|---|
| 1.0 | 2026-11-06 | B | Initial contract, written before implementation |
