# System-Level SDS (v1.0)

## 1. Architecture and stack
Modular monolith: UI (React/Vite) → REST API (Express/TypeScript) → PostgreSQL (Prisma).
- UI: display and forms, no security rules.
- API: authentication, authorization, validation (zod), business rules BR-01 to BR-09.
- Database: integrity constraints (UNIQUE, CHECK capacity > 0, foreign keys).
Communication: HTTP/JSON, httpOnly session cookie.
Critical rules (capacity, duplicates) are enforced server-side inside a transaction using SELECT ... FOR UPDATE on the event row, and backed by database constraints.

## 2. Data model
| Entity | Main fields | Constraints |
|---|---|---|
| User | id, email, passwordHash, role | unique email; role ∈ {PARTICIPANT, ORGANIZER} |
| Session | id (random token), userId, expiresAt | cascade delete with the user |
| Event | id, title, startsAt, capacity, status, organizerId | capacity > 0; status ∈ {DRAFT, PUBLISHED}; organizerId → User |
| Registration | id, eventId, userId, status, createdAt | UNIQUE(eventId, userId); status = CONFIRMED (Sprint 1) |

Ownership: an Event belongs to its organizer; a Registration belongs to its participant.

```mermaid
erDiagram
  USER ||--o{ SESSION : has
  USER ||--o{ EVENT : organizes
  USER ||--o{ REGISTRATION : makes
  EVENT ||--o{ REGISTRATION : receives
```

## 3. Migrations and demo data
Prisma migrations (`npx prisma migrate dev`). Reproducible seed (`npm run db:seed`): 2 organizers, 3 participants, 1 published event and 1 draft event per organizer. Demo passwords are read from the environment and never committed.

## 4. UI, API, roles, authentication, configuration
### 4.1 Screens and navigation

| Screen | Role | Content |
|---|---|---|
| Login | anonymous | Email and password form |
| Event list | participant, organizer | Published events with title, date, capacity and remaining places |
| Event detail | participant | Event information and a Register button |
| My registrations | participant | The participant's own registrations |
| My events | organizer | The organizer's events, including drafts, with Create and Publish actions |
| Event registrations | organizer | Registrations of one of the organizer's events |

Navigation depends on the role returned by `GET /api/auth/me`. This only adapts the display: the backend enforces every permission.

Shared UI behavior:
- Loading: a visible loading indicator while a request is pending; buttons are disabled to prevent double submission.
- Empty state: an explicit message when a list is empty (for example "No registration yet").
- Error state: the message of the API error is shown (EVENT_FULL, ALREADY_REGISTERED, validation errors) with a way to retry.
- Validation: the form shows field errors returned by the API; client-side checks are a convenience, never the rule.
- An expired session (401) sends the user to the Login screen.

### 4.2 API conventions

- Base path `/api`, JSON requests and responses, resources named in the plural.
- Input is validated with zod; invalid input returns 400.
- The identity and role of the caller always come from the server-side session, never from the request body, a header or a query parameter.
- Error body, identical for all errors: `{ "error": { "code": "EVENT_FULL", "message": "The event is full" } }`. Error responses never include a stack trace, SQL or internal identifiers beyond the requested resource.
- Status codes follow decision D-08 (401, 403, 404, 409, 400).

Endpoints of Sprint 1 (details are given in each feature contract):

| Method and path | Feature | Success |
|---|---|---|
| POST `/api/auth/login` | F-01 | 200, user and session cookie |
| POST `/api/auth/logout` | F-01 | 204 |
| GET `/api/auth/me` | F-01 | 200, current user |
| POST `/api/events` | F-02 | 201, draft event |
| POST `/api/events/:id/publish` | F-02 | 200, published event |
| GET `/api/events` | F-03 | 200, published events |
| GET `/api/events/mine` | F-02, F-03 | 200, the organizer's events including drafts |
| GET `/api/events/:id` | F-03 | 200, event |
| POST `/api/events/:id/registrations` | F-04 | 201, registration |
| GET `/api/registrations/mine` | F-05 | 200, own registrations |
| GET `/api/registrations/:id` | F-05 | 200, own registration |
| GET `/api/events/:id/registrations` | F-06 | 200, registrations of the organizer's event |

### 4.3 Role and permission matrix

| Operation | Anonymous | Participant | Organizer |
|---|---|---|---|
| Log in | yes | yes | yes |
| Log out, get current user | no | yes | yes |
| List published events, open a published event | no | yes | yes |
| Open a draft event | no | no (404) | own events only |
| List own events including drafts | no | no (403) | yes |
| Create an event | no | no (403) | yes |
| Publish an event | no | no (403) | own events only (404 otherwise) |
| Register for an event | no | yes | no (403) |
| List own registrations, open one registration | no | own only (404 otherwise) | no (403) |
| List the registrations of an event | no | no (403) | own events only (404 otherwise) |

Ownership links: an Event belongs to its organizer (`organizerId`); a Registration belongs to its participant (`userId`).

### 4.4 Authentication and session lifecycle

- Accounts are created by the seed. Passwords are hashed with argon2id; plaintext passwords are never stored or logged.
- Login: the server checks the email and password, then creates a row in the `Session` table with a random token (32 random bytes, hexadecimal) and `expiresAt = now + SESSION_TTL_HOURS` (8 hours).
- The token is sent in a cookie named `sid` with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV=production`. The token is never readable by client JavaScript.
- Every protected request: the middleware reads the cookie, loads the session and its user, rejects with 401 if the session is missing or expired (and deletes an expired session), then attaches the user and role to the request.
- Current user: `GET /api/auth/me` returns the id, email and role of the session's user.
- Logout: the session row is deleted and the cookie cleared, so the old cookie is rejected afterwards (NFR-06). Logout is idempotent and returns 204.
- A failed login returns 401 with the same message whatever the cause (D-09).

### 4.5 Configuration

| Variable | Purpose | Example in `.env.example` |
|---|---|---|
| DB_PASSWORD | Password of the local PostgreSQL container | `change-me` |
| DATABASE_URL | Connection string of the application database | `postgresql://a4d:change-me@localhost:5433/a4d` |
| DATABASE_URL_TEST | Connection string of the test database | `postgresql://a4d:change-me@localhost:5433/a4d_test` |
| SESSION_TTL_HOURS | Session lifetime | `8` |
| SEED_PASSWORD | Password given to the demo accounts by the seed | `change-me-demo` |

- The local PostgreSQL container is published on host port 5433, so it does not clash with a PostgreSQL already installed on port 5432. Inside the container PostgreSQL still listens on 5432.
- `.env` is ignored by Git; only `.env.example`, with placeholder values, is committed (NFR-05).
- In deployment, values come from the platform's environment and Secret Manager, never from the repository or from client code.
- The migration `init` creates the schema and the constraints `capacity_positive` (CHECK capacity > 0) and the UNIQUE index on (eventId, userId).

## 5. GCP deployment plan
Target: Cloud Run (application container), Cloud SQL PostgreSQL (durable storage), Secret Manager (secrets). Docker image built in Lab 5. Environment variables: DATABASE_URL, SESSION_TTL_HOURS, SEED_PASSWORD. No secrets in Git or in client code.

