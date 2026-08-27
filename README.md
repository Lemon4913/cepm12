# Talat Tha Na — เว็บแอปตลาดท่านา

Next.js app for the Talat Tha Na (ตลาดท่านา) community market: check-in progress, QR code scanning,
and accounts for admins, store owners, and tourists.

## Getting started

1. Install [Bun](https://bun.sh) if you don't have it.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy the env file and fill in real values (a random `SESSION_SECRET` matters most):
   ```bash
   cp .env.example .env
   ```
4. Create the database tables:
   ```bash
   bun run db:push
   ```
5. Seed the first admin account (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` from `.env`):
   ```bash
   bun run db:seed
   ```
6. Start the dev server:
   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded admin (or sign up as a
tourist/store account) — you'll be walked through setting up an authenticator app (TOTP) for 2FA on
first login.

## Accounts & 2FA

- Three roles: `admin`, `store`, `user` (tourist). Admin accounts aren't self-serve — only the seed
  script creates one; an admin would need to add a "promote user" tool to create more.
- 2FA is mandatory for every role, via a standard TOTP authenticator app (Google Authenticator, Authy,
  etc.) — no external service or API key required.
- Signed-in tourists get their QR-code checkpoint progress synced to their account (see
  `src/hooks/use-checkpoint-progress.ts` and `src/app/actions/progress.ts`); anonymous visitors still
  get local-only progress via `localStorage`, merged into their account the first time they log in.
- Auth code lives under `src/lib/auth/` (password hashing, TOTP, JWT-signed session cookies) and
  `src/app/actions/auth.ts` (server actions for signup/login/2FA/logout).

## Database

SQLite via [Drizzle ORM](https://orm.drizzle.team), using `@libsql/client` as the driver (chosen over
Bun's built-in `bun:sqlite` because `next build`'s page-data-collection step forks plain Node.js
workers that can't resolve the `bun:` module scheme). Schema: `src/db/schema.ts`.

- `bun run db:push` — sync the schema straight to the SQLite file (fine for this project's scale).
- `bun run db:generate` — generate a versioned migration instead, if you'd rather track migrations.
- `bun run db:studio` — open Drizzle Studio to browse the data.

## Project structure

- Bottom tab bar (4 sections): Common Info (`/`), Map (`/map`, placeholder — pending a vector map from
  the art team), QR Scan (`/scan`), Others (`/others`, project info + account links).
- `/admin`, `/store`, `/account` are role-gated (see `src/lib/auth/dal.ts` and `src/proxy.ts`).
- Font: IBM Plex Sans Thai (`next/font/google`). UI: shadcn/ui components in `src/components/ui`.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
