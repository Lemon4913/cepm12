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
| Map pan/zoom | `react-zoom-pan-pinch` | `src/components/map/market-map.tsx`. See [Market map](#market-map). |

## Project structure

```
src/
  app/
    page.tsx              Common Info tab ("/") — market history + checkpoint list
    map/page.tsx           Map tab — interactive pan/zoom site plan, see Market map
    scan/page.tsx           QR Scan tab — camera scanner
    others/page.tsx         Others tab — about, GitHub link, account/login links
    account/page.tsx        Logged-in user's profile + news opt-in + progress (role-gated)
    admin/page.tsx           Admin dashboard (role-gated: "admin")
    store/page.tsx           Store owner dashboard (role-gated: "store" | "admin") — placeholder
    achievement/page.tsx      Photo-share unlock page — see Achievement photo feature
    login/, signup/, verify-2fa/    Auth pages
    actions/
      auth.ts                Server actions: signup, login, verify/resend OTP, logout, news opt-in
      progress.ts             Server actions: read/write a signed-in user's checkpoint progress
      admin.ts                Server actions: list/promote/demote admins (multi-admin support)
      settings.ts              Server actions: read/update the app_settings singleton row
                                (currently just photoUnlockThreshold)
      stats.ts                 Server actions: admin stats dashboard queries
      feedback.ts              Server actions: submit/read feedback (open to guests too)
      stores.ts                Server actions: read/upsert/clear a map plot's store info
                                (admin-only writes) — see Market map
    layout.tsx               Root layout: font, theme provider, bottom nav, toaster,
                              OnboardingTour, AchievementWatcher (both mounted globally here)
    globals.css               Design tokens (see Theming) + market-plot hover/highlight rules
  components/
    ui/                     shadcn primitives (button, card, dialog, input, textarea, ...)
    auth/                   signup/login/OTP forms, logout button
    admin/                  admin dashboard client component, admin-management,
                            photo-threshold-form, stats-overview, feedback-summary
    account/                news opt-in toggle
    achievement/              achievement-watcher (global, one-time toast on crossing the
                              threshold), trophy-banner (persistent CTA on /scan — see below),
                              achievement-photo-card (live camera preview + canvas compositing)
    map/                      market-map.tsx — pan/zoom viewer + store detail/edit sheet,
                              see Market map
    onboarding/               onboarding-tour (first-visit walkthrough), replay-onboarding-button
    bottom-nav.tsx            The 4-tab bottom bar
    checkpoint-list.tsx        Scanned/unscanned checkpoint list (used on Home, Scan, Account)
    progress-summary-card.tsx   "X / 7 scanned" card
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
    schema.ts                   Drizzle table definitions (users, sessions, checkpoint_progress,
                                app_settings, feedback, stores)
    connection-string.ts         Builds a Postgres URL from env vars — no "server-only" import,
                                  safe to use from drizzle.config.ts and scripts/seed.ts too
    index.ts                    DB client singleton (lazy — see Database)
  proxy.ts                     Optimistic auth gate for /admin, /store, /account
public/
  map/market-plan.svg           Cleaned map artwork — see Market map
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
7. **Multiple admins** — an existing admin can promote any registered user (by email) to `admin`,
   and demote others (never themselves, and never the last remaining admin). See
   [Multi-admin support](#multi-admin-support) below.
8. **First-visit onboarding tour** (`src/components/onboarding/`) — a 5-step walkthrough dialog shown
   once automatically (tracked in `localStorage`, key `cepm12:onboarding-seen`), replayable anytime
   from Others → "ดูคำแนะนำการใช้งานอีกครั้ง".
9. **Achievement photo/share** (`/achievement`) — once a visitor's scan count reaches an
   admin-configurable threshold (`app_settings.photoUnlockThreshold`, default 5), they can take a
   selfie, which gets composited onto a branded card (canvas, client-side only — the photo never hits
   the server) they can download or share via the Web Share API. See
   [Achievement photo feature](#achievement-photo-feature) below.
10. **Login rate limiting** — 5 failed password attempts locks the account for 15 minutes
    (`users.failedLoginAttempts` / `users.lockedUntil`, enforced in `login()` in
    `src/app/actions/auth.ts`). Resets to 0 on a successful login. Account-level, not IP-level.
11. **Admin stats dashboard** (`/admin`, `src/app/actions/stats.ts` + `src/components/admin/stats-overview.tsx`) —
    total users by role, total scans, and a per-checkpoint popularity bar list. Directly serves the
    original proposal's own success metrics (user count, checkpoint popularity).
12. **Feedback/rating** (`/feedback`, open to guests too) — a 1–5 star rating + optional comment,
    stored in the `feedback` table. Admin sees the average + 10 most recent
    (`getFeedbackSummary()`, `src/components/admin/feedback-summary.tsx`).
13. **PWA manifest** (`src/app/manifest.ts`) + icon set (`public/icons/`, generated by
    `scripts/generate-icons.ts` via `sharp` — rerun that script if you want to change the app icon).
14. Everything is in Thai (the UI language), IBM Plex Sans Thai throughout.
15. **Interactive market map** (`/map`) — pan/zoom site plan with tap-to-view store info per plot,
    admin-editable inline. See [Market map](#market-map) below.
16. **Trophy banner** (`src/components/achievement/trophy-banner.tsx`) — a persistent, high-visibility
    button on `/scan` once the achievement photo is unlocked, so people don't have to already know it
    lives under Others → รูปภาพความสำเร็จ to find it. Complements (doesn't replace) the one-time
    celebration toast in `achievement-watcher.tsx`.

### Not yet built (known gaps)

- **Store dashboard self-service** — `/store` is still a placeholder; there's no way yet for a store
  owner to edit their own store's name/description/hours/location directly. This is different from
  the map's store info (see [Market map](#market-map)), which an **admin** can fill in on a store's
  behalf right now — self-service editing would need a way to link a specific store account to a
  specific map plot, which doesn't exist yet. See
  [Adding a feature: store profile editing](#adding-a-feature-store-profile-editing) below for where
  to start.
- **Map plot content is empty by default** — the map itself is fully built, but all plots start with
  no name/photo/description until an admin fills them in via the map's edit sheet. There's also no
  photo upload pipeline yet — an admin has to place image files under `public/stores/<plot-id>/` (or
  use an external URL) and paste the path/URL into the edit form.
- **News opt-in is capture-only** — the checkbox is stored on the user record
  (`users.newsOptIn`), but nothing sends an actual newsletter. The email infrastructure (Resend) is
  already wired up for OTP codes, so building this is mostly "compose an email, loop over opted-in
  users" — see `src/lib/auth/email.ts` for the existing send pattern.

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

## Multi-admin support

`src/app/actions/admin.ts`. Any signed-in admin can:

- **Promote**: enter a *registered* user's email → their `role` becomes `admin`. The target must
  already have an account (signup still only offers `user`/`store` — there's still no way to create
  a brand-new admin account directly, only to promote an existing one).
- **Demote**: revoke another admin's role back to `user`. Two guards, both server-enforced (not just
  hidden in the UI): an admin can't demote themselves, and the last remaining admin can't be demoted
  by anyone — `listAdmins().length <= 1` blocks it. This prevents ever locking everyone out of `/admin`.

UI lives in `src/components/admin/admin-management.tsx`, rendered on `/admin`. `bun run db:seed` is
still the only way to create the *first* admin from nothing.

## Achievement photo feature

- **Threshold**: a single admin-editable number, `app_settings.photoUnlockThreshold` (singleton row,
  `id = 1`, default `5`). Read via `getPhotoUnlockThreshold()` — deliberately **not** gated behind
  auth, since guests need to know when they've unlocked it too. Updated via
  `updatePhotoUnlockThreshold()` (admin-only), form in `src/components/admin/photo-threshold-form.tsx`.
- **Discovery**: two complementary surfaces, not one —
  `src/components/achievement/achievement-watcher.tsx` (mounted globally in the root layout) fires a
  one-time toast the moment `scannedCount` first crosses the threshold (guarded by `localStorage` key
  `cepm12:achievement-celebrated`), while `src/components/achievement/trophy-banner.tsx` (mounted on
  `/scan`) shows a persistent, always-visible banner for as long as the achievement stays unlocked —
  added because most people never found their way to `/achievement` through Others on their own once
  the one-time toast was gone.
- **The card itself**: `src/components/achievement/achievement-photo-card.tsx`. Deliberately has
  **no server round-trip for the photo**. It requests the front camera directly (`getUserMedia`) and
  shows a **live preview with the winner-frame artwork overlaid** so the person can line themselves up
  before capturing — falls back to a plain `<input type="file" accept="image/*">` picker if camera
  access fails or isn't available. Capture draws the live video frame (or the picked file) onto a
  square `<canvas>`, cover-fit, then layers `public/achievement/winner-frame.png` on top — that PNG's
  background and inner "photo well" were both keyed to transparent (see git history for the removal
  script) so the frame's decorative border sits over the photo cleanly. Output is a PNG data URL,
  offered via a plain `<a download>` and, where supported, `navigator.share()` with a `File`. No image
  ever touches the database or a server — a deliberate privacy/simplicity choice; revisit only if a
  future requirement needs the photos stored server-side (e.g. an admin gallery of submissions).

## Market map

- **Artwork**: `public/map/market-plan.svg`, cleaned up from a hand-drawn Inkscape site plan. The
  original export was ~11MB because of a hidden (`display:none`) full-resolution tracing photo left
  in by the artist — stripped out, bringing it to ~60KB. Every plot shape (rect/path) carries a
  `data-plot-id` (its original SVG id) and `data-plot-zone` (the Inkscape layer name it came from,
  e.g. `Rim tanon`/`klang`/`Saan jao mae`) so the frontend can find and identify each one generically.
- **Store data**: `stores` table (`src/db/schema.ts`), keyed by that same `data-plot-id` — a row only
  exists once someone has actually filled a plot in; a plot with no row renders as an empty
  "ยังไม่มีข้อมูลจุดนี้" placeholder. Read via `getStores()` (public), written via `upsertStore()` /
  `clearStore()` (admin-only) in `src/app/actions/stores.ts`. No photo upload pipeline — photo fields
  are just paths/URLs an admin pastes in (e.g. an image placed under `public/stores/<plot-id>/`).
- **Viewer**: `src/components/map/market-map.tsx`, using `react-zoom-pan-pinch` for pan/pinch/wheel
  zoom over the inline SVG (rendered via `dangerouslySetInnerHTML` — the SVG string is read
  server-side in `src/app/map/page.tsx` and passed down, no client fetch needed). Tapping any
  `[data-plot-id]` shape opens a bottom Sheet with that plot's info, or an inline edit form instead if
  the current user is an admin — editing happens right from the map, there's no separate admin list
  page for it. Plots that already have a name get a highlighted outline (`.market-plot[data-has-info]`
  in `globals.css`).
- **Two easy-to-hit gotchas already worked out, don't re-break them**:
  - The library's default wheel-zoom mode (`smooth: true`) multiplies your configured `step` by the
    wheel event's raw `deltaY` — a plain mouse fires one wheel event per notch with `deltaY` around
    100, so a `step` sized for "per notch" (e.g. `0.15`) becomes a scale jump of `~15`, blowing past
    both zoom bounds in a single notch. The current `step: 0.0015` is calibrated for that
    multiplication instead.
  - The library's default pan bounds let the map be dragged **fully off-screen** once it's zoomed out
    smaller than the viewport (the allowed pan slack equals the *entire* size difference). Fixed with
    `centerZoomedOut` (halves that slack) plus a `minScale` that keeps the map from getting too much
    smaller than the viewport in the first place. If pan/zoom ever feels "lost the map again," check
    these two props first before touching anything else.
- Canvas text elsewhere in the app (e.g. the achievement card, before the winner-frame overlay
  replaced it) uses the `IBM Plex Sans Thai` family by name — it renders correctly because the font is
  already loaded application-wide via `next/font`, but compositing code awaits `document.fonts.ready`
  first to avoid a fallback-font flash on the very first draw. Keep this in mind for any future canvas
  text.

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

Tables (`src/db/schema.ts`): `users` (`role` is a real Postgres enum: admin/store/user; also holds
`failedLoginAttempts`/`lockedUntil` for login rate limiting), `sessions`, `checkpoint_progress`
(unique on `userId` + `checkpointId`), `app_settings` (singleton row, `id = 1`, currently just holds
`photoUnlockThreshold`), `feedback` (`userId` nullable — guests can leave feedback too), `stores`
(one row per map plot that's been filled in, keyed by the plot's SVG id — see
[Market map](#market-map)).

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
- Base UI's `Button` expects an actual `<button>` for its `render` prop by default
  (`nativeButton: true`). Rendering it as a `<Link>` (or any non-button element) needs
  `nativeButton={false}` explicitly, or Base UI throws a console error — see `src/app/not-found.tsx`
  for the pattern.
- `qr-scanner`'s viewfinder color is hardcoded inline (`stroke:#e9b213`, its default amber) with no
  config option to change it. Overridden with `!important` in `globals.css`
  (`.scan-region-highlight-svg`, `.code-outline-highlight`) — don't remove that rule or the scanner
  reverts to a color that clashes with the brand.
- The admin QR-print dialog (`src/components/admin-checkpoint-table.tsx`) uses a `data-print-root`
  attribute + a `@media print` block in `globals.css` (the "hide everything, show this" `visibility`
  trick) rather than hiding specific sibling elements — this is deliberate, since Base UI's Dialog
  portal structure isn't something to depend on for a `display: none` selector.

## Adding a feature: store profile editing

The most likely next piece of work. **Note:** a `stores` table already exists (see
[Market map](#market-map)), but it's keyed by *map plot id*, not by user — it's how an admin
describes what's at a location, not a store owner's own account-linked profile. Don't create a
second, differently-shaped `stores` table; either extend this one or link it up. Rough shape:

1. Add an `ownerUserId` column (nullable, `references(() => users.id)`) to the existing `stores`
   table in `src/db/schema.ts`, plus whatever fields self-service editing needs beyond what's there
   already (`name`, `description`, `photoUrls`) — e.g. `hours`, `location`. Run `bun run db:push`.
2. Decide how a plot gets linked to an account in the first place — there's no UI for this yet.
   Simplest: an admin-only "assign owner" action (follow the multi-admin promote/demote pattern in
   `src/app/actions/admin.ts`) that sets `ownerUserId` on a plot from the map's existing edit sheet.
3. Add a server action (new file or extend `src/app/actions/stores.ts`, `"use server"`) that lets a
   `store`-role user update only the plot(s) where `ownerUserId` matches their own id — follow
   `updateNewsOptIn` in `src/app/actions/auth.ts` as a template for the auth check shape.
4. Build the form in `src/app/store/page.tsx`, following the pattern in
   `src/components/auth/signup-form.tsx` (`useActionState` + a client form component) — or reuse the
   existing edit form already built into `src/components/map/market-map.tsx`'s Sheet, if it's easier
   to let a store owner edit from the map directly rather than from `/store`.

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
- Promote a second account to admin, confirm it can access `/admin`; confirm you can't demote
  yourself, and can't demote the last remaining admin.
- Set the photo-unlock threshold low (e.g. 1) in `/admin`, scan one checkpoint, confirm the
  celebration toast fires and `/achievement` unlocks; confirm it does **not** fire again on reload.
  Also confirm the trophy banner on `/scan` appears at the same time, and stays visible on repeat
  visits (unlike the one-time toast).
- `/map`: pan and zoom work (drag, wheel/pinch, double-tap); dragging while fully zoomed out never
  loses the map off-screen. Tap a plot with no data → placeholder sheet; as admin, tap a plot, fill
  in name/description/photo path, save, confirm it persists on reload and the plot now shows a
  highlighted outline.
