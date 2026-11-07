# A4D-Event-Registration
## Local setup

Requirements: Node 22.12+ (`nvm use 22`), Docker.

```bash
cp .env.example .env            # then set DB_PASSWORD and SEED_PASSWORD (placeholders only in Git)
docker compose up -d            # PostgreSQL on host port 5433
npx prisma generate
npx prisma migrate deploy       # development database
npm run db:seed                 # demo data
```

## Test database

Integration tests use the database `a4d_test` (DATABASE_URL_TEST). Prepare it once, and again whenever you want a clean state:

```bash
docker compose exec db psql -U a4d -d a4d -c "CREATE DATABASE a4d_test;"
export $(grep ^DATABASE_URL_TEST .env | xargs)
DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy
DATABASE_URL=$DATABASE_URL_TEST npm run db:seed    # some tests rely on the seeded accounts
npm test
```
