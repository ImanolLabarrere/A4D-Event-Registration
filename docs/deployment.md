# Deployment Guide — A4D Event Registration

This document explains how to deploy, release, and operate the A4D Event Registration
application on Google Cloud Run.

---

## Architecture Overview

```
GitHub (main branch)
       │  push
       ▼
GitHub Actions ─── CI gate (test-and-docker)
       │  passed
       ▼
Artifact Registry ◄── docker build + push (image:SHA)
       │
       ▼
Cloud Run Job (a4d-events-migrate) ── prisma migrate deploy + seed
       │  success
       ▼
Cloud Run Service (a4d-events) ── public HTTPS URL
       │
       └── Cloud SQL for PostgreSQL (a4d-events-pg, postgres:16)
```

**GCP project:** `cpe-se-course-2026`  
**Region:** `asia-southeast1`  
**Repository:** https://github.com/ImanolLabarrere/A4D-Event-Registration

---

## Environment Variables

### Application (runtime — set via Secret Manager / Cloud Run env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (injected from Secret Manager) | ✅ |
| `PORT` | HTTP port the server listens on (default: `3000`) | ✅ |
| `NODE_ENV` | Set to `production` in Cloud Run | ✅ |
| `TZ` | Timezone — set to `Asia/Bangkok` | optional |
| `ADMIN_PASSWORD` | Initial admin password seed (from Secret Manager) | on first deploy |
| `DEMO_USER_PASSWORD` | Demo user password (only with `--demo` flag) | optional |
| `FORCE_SEED` | Set `true` to re-seed even if users exist | optional |
| `SESSION_TTL_HOURS` | Session lifetime in hours (default: `24`) | optional |

### GitHub Actions (GitHub Environment: `demo`)

| Variable / Secret | Where | Description |
|-------------------|-------|-------------|
| `GCP_PROJECT_ID` | Variable | GCP project: `cpe-se-course-2026` |
| `GCP_REGION` | Variable | Region: `asia-southeast1` |
| `WIF_PROVIDER` | Variable | Workload Identity Federation provider URI |
| `WIF_SERVICE_ACCOUNT` | Variable | Deployer service account email |
| `SMOKE_EMAIL` | Variable | (optional) login email for smoke test |
| `SMOKE_PASSWORD` | Secret | (optional) login password for smoke test |

---

## GCP Resources

| Resource | Name | Type |
|----------|------|------|
| Cloud Run service | `a4d-events` | Public, 0–3 instances, 512 Mi |
| Cloud Run job | `a4d-events-migrate` | Runs migrations + seed on each release |
| Cloud SQL instance | `a4d-events-pg` | PostgreSQL 16, `db-f1-micro`, enterprise |
| Database | `a4d` | Inside `a4d-events-pg` |
| DB user | `a4d` | Password stored in Secret Manager |
| Artifact Registry | `a4d-events` | Docker repo in `asia-southeast1` |
| Service account | `a4d-events-runner` | Runtime identity for Cloud Run |
| Secret | `a4d-events-database-url` | Full DATABASE_URL including password |
| Secret | `a4d-events-admin-password` | Initial admin password |
| Secret | `a4d-events-demo-password` | Demo user password (optional) |

---

## First Deployment (one-time manual setup)

> Run once from Cloud Shell or any machine with `gcloud` authenticated to the project.

```bash
git clone https://github.com/ImanolLabarrere/A4D-Event-Registration.git
cd A4D-Event-Registration

# Dry run first (prints commands, makes no GCP calls)
DRY_RUN=1 PROJECT_ID=cpe-se-course-2026 REGION=asia-southeast1 bash deploy/deploy.sh

# Real deploy (creates all resources + first Cloud Run deployment)
PROJECT_ID=cpe-se-course-2026 REGION=asia-southeast1 bash deploy/deploy.sh

# After Cloud SQL is created, disable storage auto-increase to control costs
gcloud sql instances patch a4d-events-pg --no-storage-auto-increase --project=cpe-se-course-2026
```

After the script finishes, verify the app:

```bash
# Replace <URL> with the Cloud Run URL printed by deploy.sh
curl <URL>/api/health    # → {"status":"ok"}
curl <URL>/api/ready     # → {"status":"ready"} (or 503 if DB not connected)
```

---

## Routine Releases (automatic via CI/CD)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. **CI gate** — runs `test-and-docker` (unit tests + Docker build)
2. **Authenticate** — Workload Identity Federation (no stored key)
3. **Build + push** — image tagged `<40-char commit SHA>`
4. **Release** — `deploy/release.sh` verifies image → runs migration job → updates service
5. **Smoke test** — `deploy/smoke_test.py` checks `/api/health`, `/api/ready`, `/api/categories`

**Standard PR flow:**

```
feature/my-change  →  PR → staging  (CI must pass, teammate reviews)
staging            →  PR → main     (triggers deploy pipeline)
```

---

## Manual Rollback

To roll back to a previous release:

1. Go to **GitHub Actions → Deploy demo → Run workflow**
2. Enter the full 40-character commit SHA of the target image
3. The workflow skips tests and build; it only points the Cloud Run service to that image

Via CLI:
```bash
PROJECT_ID=cpe-se-course-2026 REGION=asia-southeast1 \
  IMAGE_TAG=<40-char-sha> ROLLBACK=true bash deploy/release.sh
```

---

## Teardown (stop billing)

```bash
# Dry run first
DRY_RUN=1 PROJECT_ID=cpe-se-course-2026 bash deploy/teardown.sh

# Destructive — deletes all resources including the database
PROJECT_ID=cpe-se-course-2026 bash deploy/teardown.sh
```

> ⚠️ All Cloud SQL data is permanently lost. You must type the project ID to confirm.

---

## Health Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Always returns `200 {"status":"ok"}` — liveness probe |
| `/api/ready` | GET | Returns `200 {"status":"ready"}` if DB is reachable, else `503` |
| `/` | GET | HTML landing page |
