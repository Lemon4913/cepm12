# Talat Tha Na — เว็บแอปตลาดท่านา

Next.js app for the Talat Tha Na (ตลาดท่านา) community market: check-in progress, QR code scanning,
and accounts for admins, store owners, and tourists.

## Getting started

1. Install [Bun](https://bun.sh) and [Docker](https://docs.docker.com/get-docker/) if you don't have
   them.

   > **Linux: running `docker`/`docker compose` without `sudo`.** If you get "permission denied while
   > trying to connect to the Docker daemon socket", your user isn't in the `docker` group yet:
   > ```bash
   > sudo usermod -aG docker $USER
   > ```
   > Then **log out and back in** (or run `newgrp docker` in the current shell) for it to take effect.
   > This is a one-time machine setup step, unrelated to this repo. (Docker Desktop on macOS/Windows
   > doesn't need this — it isn't gated by a Unix socket the same way.)
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy the env file and fill in real values (at minimum, a real `SESSION_SECRET` and a Postgres
   password):
   ```bash
   cp .env.example .env
   ```
4. Start the Postgres container (reads its `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` from the
   same `.env`, via `docker-compose.yml`):
   ```bash
   bun run db:up
   ```
5. Create the database tables:
   ```bash
   bun run db:push
   ```
6. Seed the first admin account (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` from `.env`):
   ```bash
   bun run db:seed
   ```
7. Start the dev server:
   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded admin (or sign up as a
tourist/store account) — a 6-digit code is emailed to you to finish logging in (without
`RESEND_API_KEY` set, it's printed to the server console instead, for local dev).

## Accounts & 2FA

- Three roles: `admin`, `store`, `user` (tourist). Admin accounts aren't self-serve — only the seed
  script creates one; an admin would need to add a "promote user" tool to create more.
- 2FA is mandatory for every role: a 6-digit code emailed via [Resend](https://resend.com) on every
  login, valid for 10 minutes (`src/lib/auth/otp.ts`, `src/lib/auth/email.ts`).
- Signed-in tourists get their QR-code checkpoint progress synced to their account (see
  `src/hooks/use-checkpoint-progress.ts` and `src/app/actions/progress.ts`); anonymous visitors still
  get local-only progress via `localStorage`, merged into their account the first time they log in.
- Auth code lives under `src/lib/auth/` (password hashing, OTP, JWT-signed session cookies) and
  `src/app/actions/auth.ts` (server actions for signup/login/2FA/logout).

## Database

Postgres via [Drizzle ORM](https://orm.drizzle.team), using the `postgres` (postgres.js) driver.
Schema: `src/db/schema.ts`. Connection details come from `.env` — either a single `DATABASE_URL`, or
discrete `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
(built into a connection string by `src/db/connection-string.ts`). Those same `POSTGRES_*` names also
configure the local container in `docker-compose.yml`, so one `.env` covers both.

- `bun run db:up` / `bun run db:down` — start/stop the local Postgres container.
- `bun run db:push` — sync the schema straight to the database (fine for this project's scale).
- `bun run db:generate` — generate a versioned migration instead, if you'd rather track migrations.
- `bun run db:studio` — open Drizzle Studio to browse the data.

To point at a managed Postgres instead of the local container (e.g. on a deploy platform), just set
`DATABASE_URL` and skip `bun run db:up`.

## Project structure

- Bottom tab bar (4 sections): Common Info (`/`), Map (`/map`, placeholder — pending a vector map from
  the art team), QR Scan (`/scan`), Others (`/others`, project info + account links).
- `/admin`, `/store`, `/account` are role-gated (see `src/lib/auth/dal.ts` and `src/proxy.ts`).
- Font: IBM Plex Sans Thai (`next/font/google`). UI: shadcn/ui components in `src/components/ui`.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
