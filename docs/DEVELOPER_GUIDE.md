# Developer Guide — Talat Tha Na (ตลาดท่านา)

Internal reference for anyone continuing development on this app. For the "why" behind the
project, see [`CEP_ข้อเสนอโครงการ.md`](./CEP_ข้อเสนอโครงการ.md) (the original proposal). For
setup steps, see the root [`README.md`](../README.md).

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | **Breaking changes vs. your training data** — read `node_modules/next/dist/docs/` before touching routing/data/proxy code. Middleware is now called **Proxy** (`src/proxy.ts`, not `middleware.ts`). |
| Runtime / package manager | [Bun](https://bun.sh) | `bun run dev` / `bun run build` / `bun x <tool>`. Next.js's own build workers still fork plain Node.js processes internally — see the [Database](#database) section. |
| Language | TypeScript, strict mode | |
| UI | React 19, [shadcn/ui](https://ui.shadcn.com) (`style: "base-nova"`, built on `@base-ui/react`, **not** Radix) | Components live in `src/components/ui/`; add more with `bun x shadcn@latest add <name>`. |
| Styling | Tailwind CSS v4 | Tokens in `src/app/globals.css` (`:root` / `.dark`), see [Theming](#theming). |
| Font | IBM Plex Sans Thai via `next/font/google` | Loaded in `src/app/layout.tsx`. |
| Database | Postgres (Docker locally) via [Drizzle ORM](https://orm.drizzle.team) + `postgres` (postgres.js) | Schema: `src/db/schema.ts`. See [Database](#database). |
| Auth | Hand-rolled: `bcryptjs` + `jose` (JWT session cookies) + emailed one-time codes ([Resend](https://resend.com)) | `src/lib/auth/`. No third-party auth provider. |
| Validation | Zod v4 | `src/lib/auth/schemas.ts` |
| QR | `qr-scanner` (camera decode), `qrcode` (generate — admin's printable checkpoint QR codes) | |
| Toasts | `sonner` (via shadcn) | |

## Project structure

```
src/
  app/
    page.tsx              Common Info tab ("/") — market history + checkpoint list
    map/page.tsx           Map tab — placeholder, waiting on vector map from the art team
    scan/page.tsx           QR Scan tab — camera scanner
    others/page.tsx         Others tab — about, GitHub link, account/login links
    account/page.tsx        Logged-in user's profile + news opt-in + progress (role-gated)
    admin/page.tsx           Admin dashboard (role-gated: "admin")
    store/page.tsx           Store owner dashboard (role-gated: "store" | "admin") — placeholder
    login/, signup/, verify-2fa/    Auth pages
    actions/
      auth.ts                Server actions: signup, login, verify/resend OTP, logout, news opt-in
      progress.ts             Server actions: read/write a signed-in user's checkpoint progress
    layout.tsx               Root layout: font, theme provider, bottom nav, toaster
    globals.css               Design tokens (see Theming)
  components/
    ui/                     shadcn primitives (button, card, dialog, input, ...)
    auth/                   signup/login/OTP forms, logout button
    admin/                  admin dashboard client component
    account/                news opt-in toggle
    bottom-nav.tsx            The 4-tab bottom bar
    checkpoint-list.tsx        Scanned/unscanned checkpoint list (used on Home, Scan, Account)
    progress-summary-card.tsx   "X / 6 scanned" card
    qr-code-scanner.tsx         Camera-based QR decode (dynamic-imported, client-only)
    qr-code-preview.tsx         Renders a QR code image from a string (admin checkpoint printouts)
    manual-code-entry.tsx        Type-in fallback for the 6-digit checkpoint code (no camera needed)
  hooks/
    use-checkpoint-progress.ts  Single source of truth for scan progress — see below
  lib/
    checkpoints.ts             Static checkpoint data (id, name, description, QR value)
    site-config.ts              Editable site-wide config (GitHub URL, etc.)
    auth/                      password.ts, otp.ts, email.ts, session.ts, dal.ts, schemas.ts
  db/
    schema.ts                   Drizzle table definitions (users, sessions, checkpoint_progress)
    connection-string.ts         Builds a Postgres URL from env vars — no "server-only" import,
                                  safe to use from drizzle.config.ts and scripts/seed.ts too
    index.ts                    DB client singleton (lazy — see Database)
  proxy.ts                     Optimistic auth gate for /admin, /store, /account
scripts/
  seed.ts                      Creates the first admin account from .env
drizzle.config.ts               drizzle-kit config (schema path, postgresql dialect)
docker-compose.yml               Local Postgres container
```

## Features implemented

1. **Bottom-nav shell** — 4 tabs (Common Info / Map / Scan / Others), mobile-first, safe-area aware.
2. **Checkpoint check-in system** — real check-in points (per the art/install team's site survey PDF)
   in `src/lib/checkpoints.ts`. Each checkpoint's `qrValue` is a 6-digit numeric code, printed on its
   physical sign as both a QR code and plain digits. Scanning (or manually typing) that code marks it
   scanned via `src/hooks/use-checkpoint-progress.ts`.
3. **Manual code entry fallback** (`/scan`, `src/components/manual-code-entry.tsx`) — for when the
   camera isn't available/permitted, visitors can type the 6-digit code instead. Shares the same
   lookup/mark-scanned logic as camera decode (`processCode` in `src/app/scan/page.tsx`), just without
   the camera's short re-scan cooldown.
4. **Accounts + mandatory email-OTP 2FA** for three roles (`admin`, `store`, `user`). See
   [Auth flow](#auth-flow) below.
5. **Server-synced progress** — signed-in users' scans are stored in the `checkpoint_progress` table
   instead of (or in addition to, on first login) `localStorage`.
6. **Admin tools** (`/admin`, role-gated) — manually toggle a checkpoint's scanned state (for
   testing), view/print each checkpoint's QR code, reset progress.
7. Everything is in Thai (the UI language), IBM Plex Sans Thai throughout.

### Not yet built (known gaps)

- **Map tab** — intentionally a placeholder; waiting on a vector map file from the art team (per the
  original proposal). See [`src/app/map/page.tsx`](../src/app/map/page.tsx).
- **Store dashboard** — placeholder only. There's no way yet for a store owner to edit their store's
  name/description/hours/location. This is the most likely next feature to build; see
  [Adding a feature: store profile editing](#adding-a-feature-store-profile-editing) below for where
  to start.
- **News opt-in is capture-only** — the checkbox is stored on the user record
  (`users.newsOptIn`), but nothing sends an actual newsletter. The email infrastructure (Resend) is
  already wired up for OTP codes, so building this is mostly "compose an email, loop over opted-in
  users" — see `src/lib/auth/email.ts` for the existing send pattern.
- **No admin UI to promote a user to admin** — only `bun run db:seed` creates an admin account.

## Auth flow

Everything lives under `src/lib/auth/` and `src/app/actions/auth.ts`. No third-party auth
provider — this was a deliberate choice to avoid requiring external service accounts/API keys beyond
the one (Resend) needed to actually deliver email.

- **Passwords**: `bcryptjs`, 12 salt rounds (`src/lib/auth/password.ts`).
- **2FA**: a 6-digit numeric code, generated with `node:crypto`'s `randomInt` (`src/lib/auth/otp.ts`),
  emailed via [Resend](https://resend.com) (`src/lib/auth/email.ts`), valid for 10 minutes. **2FA is
  mandatory** for every role — there is no way to skip it. Without `RESEND_API_KEY` set, the code is
  logged to the server console instead of sent — useful for local dev, never leave it unset in
  production.
- The code is never stored in plaintext: `users.otpCodeHash` holds an **HMAC** (keyed with
  `SESSION_SECRET`, not a plain hash), so a leaked column is useless without the secret too.
- **Sessions**: database-backed. A session row lives in the `sessions` table; the browser only holds
  a `jose`-signed JWT containing the session id, in an `httpOnly`, `sameSite=lax` cookie
  (`src/lib/auth/session.ts`). 30-day expiry.
- **Two-step login**: password → **pending cookie** (`cepm12_pending`, 10 min TTL) → emailed code →
  real session. The pending cookie is what lets `/verify-2fa` know who's mid-login without granting
  access yet, and `resendOtp()` (in `auth.ts`) reuses it to re-send without asking for the password
  again — rate-limited to one resend per 30 seconds.
- **Route protection**: `src/proxy.ts` does an *optimistic* check (cookie present or not) on
  `/admin`, `/store`, `/account` and redirects to `/login` early. The **authoritative** check is
  `requireUser(roles?)` in `src/lib/auth/dal.ts`, called at the top of each protected page — always
  add that call to any new protected page; don't rely on the proxy alone (see the Next.js docs on
  this exact point, `node_modules/next/dist/docs/01-app/02-guides/authentication.md`).
- **Admin accounts are not self-serve.** Signup only offers `user` / `store`. The only way to create
  an admin is `bun run db:seed` (reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env`).
  If you build an admin-management UI, gate it behind `requireUser(["admin"])`.

## Database

Postgres via Drizzle ORM, using the `postgres` (postgres.js) driver — a normal npm package, not
Bun's built-in `bun:sqlite` or any native-binding driver, so it behaves identically in Bun, plain
Node.js build workers, and inside a container.

> **Why not `bun:sqlite` (this project started on SQLite)?** `next build`'s "Collecting page data"
> step forks plain Node.js worker processes (via `jest-worker`) regardless of what launched the
> parent `next build` process. Those workers can't resolve the `bun:` module scheme, so any route
> that transitively imports `bun:sqlite` fails the production build. Keep this in mind if you're
> ever tempted to reach for a Bun-native API in code that a page might import.

**Local setup**: `docker-compose.yml` runs a single Postgres container, configured entirely from
`.env` (`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` — the same names the
official `postgres` image itself reads, so one `.env` configures both). `src/db/connection-string.ts`
builds the connection URL those parts (or a `DATABASE_URL` override, e.g. for a managed provider) —
deliberately has **no** `"server-only"` import so it's safe to use from `drizzle.config.ts` and
`scripts/seed.ts`, which run outside Next's bundler.

```bash
bun run db:up         # start the local Postgres container (docker compose up -d postgres)
bun run db:down        # stop it
bun run db:push         # sync schema straight to the database (used for this project so far)
bun run db:generate      # generate a versioned migration instead, if you'd rather track history
bun run db:studio         # browse the data in Drizzle Studio
bun run db:seed            # create the first admin account from .env
```

Tables (`src/db/schema.ts`): `users` (`role` is a real Postgres enum: admin/store/user), `sessions`,
`checkpoint_progress` (unique on `userId` + `checkpointId`).

`src/db/index.ts` and everything under `src/lib/auth/` import the `server-only` package, which
throws if imported outside Next.js's bundler. That means **`scripts/seed.ts` cannot import from
those files** — it re-implements the tiny bit of DB/password logic it needs standalone (using
`src/db/connection-string.ts`, which is safe to share, and its own local `hashPassword`). Keep that
in mind if you add more standalone scripts.

The DB client (`src/db/index.ts`) opens its connection **lazily**, on first query rather than at
module import — this matters because some pages transitively import it just to check "is someone
logged in?", and that import happens during `next build`'s static analysis before any real database
is necessarily reachable (and before a deploy platform's env vars/volumes are attached). Don't
"simplify" this back to an eager top-level connection without re-testing `bun run build`.

## Theming

All colors are CSS custom properties in `src/app/globals.css`, following shadcn's token convention
(`--primary`, `--background`, `--muted`, etc.), consumed via Tailwind utility classes
(`bg-primary`, `text-muted-foreground`, ...) — **never hardcode a color in a component.** Both a
light and a dark palette are defined (`:root` and `.dark`).

Brand palette (from the project's color-palette slide): deep teal `#0E8983` (primary — active nav,
buttons, "scanned" state), deep red `#A82328` (destructive — reset/delete actions), warm
cream/tan (secondary/muted surfaces), pale teal (`#EFF8F7`, page background — a deliberate choice
over generic gray/cream).

## Conventions / gotchas for this codebase

- **This is Next.js 16, not the Next.js in your training data.** Read the relevant doc under
  `node_modules/next/dist/docs/01-app/` before writing routing, data-fetching, or proxy code —
  conventions have changed (e.g. Middleware → Proxy).
- Prefer **Server Actions** (`"use server"` functions in `src/app/actions/`) over hand-rolled API
  routes for mutations — this is what the whole auth and progress-sync system uses. A Server Action
  can be called directly from a client component (not just via `<form action={...}>`), which is how
  `src/hooks/use-checkpoint-progress.ts` fetches/pushes progress.
- **`useCheckpointProgress()`** (`src/hooks/use-checkpoint-progress.ts`) is the single source of
  truth for scan state across the whole app. It transparently handles both cases: signed-in
  (server/DB-backed) and guest (`localStorage`-backed, merged into the account on first login). Any
  new UI that reads or writes scan state should go through this hook, not `localStorage` or the
  progress server actions directly.
- Package manager is Bun; **npm scripts run through Bun's own shell**, which is why
  `"dev": "NEXT_TELEMETRY_DISABLED=1 next dev"` works cross-platform without `cross-env` — this
  was needed because Next's telemetry write hits an `EXDEV` (cross-device rename) error in this
  particular Windows environment otherwise.
- shadcn in this project uses **Base UI** (`@base-ui/react`), not Radix — check
  `node_modules/@base-ui/react` types when you need a prop that isn't obvious (e.g. checkbox/radio
  form participation quirks: unchecked checkboxes submit `null`, not `""`, from `FormData`).
- Files that need to run standalone via `bun run` (currently just `scripts/seed.ts`) can't import
  anything with a `"server-only"` guard. Put shared logic those scripts need in a file with no such
  import (like `src/db/connection-string.ts`) rather than duplicating it, when practical.

## Adding a feature: store profile editing

The most likely next piece of work. Rough shape, following existing patterns:

1. Add columns to `users` (or a new `stores` table if a store should ever have more than one owner)
   in `src/db/schema.ts` — e.g. `description`, `hours`, `location`. Run `bun run db:push`.
2. Add a Zod schema in `src/lib/auth/schemas.ts` (or a new `src/lib/store/schemas.ts`).
3. Add a server action (new file `src/app/actions/store.ts`, `"use server"`) that calls
   `requireUser(["store", "admin"])`-equivalent (`getCurrentUser()` + a role check) before writing —
   follow `updateNewsOptIn` in `src/app/actions/auth.ts` as a template.
4. Build the form in `src/app/store/page.tsx`, following the pattern in
   `src/components/auth/signup-form.tsx` (`useActionState` + a client form component).

## Testing checklist before shipping auth/DB changes

There's no automated test suite yet. Manually verify at minimum:

- `bun run build` and `bun run lint` are clean.
- `bun run db:up && bun run db:push` succeed against a fresh container.
- Sign up as `user` and as `store`, receive and enter the emailed OTP code, land on the right page
  per role.
- Log out, log back in, verify the OTP flow again (and try "resend code").
- Confirm role gating: a `user`-role account visiting `/admin` or `/store` bounces to `/account`.
- Scan/toggle a checkpoint while signed in, hard-reload, confirm it persisted (server-backed).
- Sign out and confirm guest `localStorage` progress still works independently.
