# Omega Tutor V1

Detect → Diagnose → Repair → Remember. Typed reasoning only; Intro Mechanics domain; triangulation gating; Deep Thought latency; dispute/adjudication.

## Stack

- **apps/web** — Next.js (App Router) + Tailwind
- **packages/db** — Postgres + Prisma (migrations, seed)
- **packages/core** — Gating, confidence/decay, scheduler, dispute, LLM boundary

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. **Create the database** (no interactive password). Use the same host/port/user/password as in `DATABASE_URL`, but connect to `postgres` and create `omega_tutor`:
   ```bash
   # Replace with your actual password; port 5432 = existing omega-postgres, 5433 = omega-tutor docker
   psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/postgres" -c "CREATE DATABASE omega_tutor;"
   ```
   Or with env (no password in command):
   ```bash
   export PGPASSWORD=yourpassword
   psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "CREATE DATABASE omega_tutor;"
   ```
3. Start Postgres (if using omega-tutor’s): `docker-compose up -d`
4. Migrate: from repo root `npm run db:migrate`, or from `packages/db`: `npm run migrate`
5. Seed: from repo root `npm run db:seed`, or from `packages/db`: `npm run seed` (loads `.env` from omega-tutor root)
6. Run web: `npm run dev` (from repo root)

## Commands (from repo root)

- `npm run dev` — start Next.js
- `npm run db:generate` — Prisma generate
- `npm run db:migrate` — run migrations
- `npm run db:seed` — seed concepts, edges, misconception targets, config
- `npm run test` — run workspace tests (core unit tests)
- Acceptance tests: from `packages/db` or `tests`, set `DATABASE_URL` then `npm run test` (acceptance tests skip if no `DATABASE_URL`)

## Acceptance tests (must pass)

- Creates learner + session, executes ≥1 probe, stores observation
- EMERGING → ACTIVE only after 3 varied-context observations meeting threshold
- Dispute creates adjudication probe; blocks repeated dispute same session
- Scheduler produces queue items; enforces ratio cap + time floor
- Audit affordance displays probe rationale from stored fields

Run with DB: `cd omega-tutor && DATABASE_URL="postgresql://postgres:postgres@localhost:5433/omega_tutor" npm run test --workspace=omega-tutor-tests` (or run from `tests` with `DATABASE_URL` set).
