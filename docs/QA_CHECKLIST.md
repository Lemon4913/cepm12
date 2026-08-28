# QA Checklist — Talat Tha Na

Run through this before telling anyone the site is "ready" — after every deploy, and after any change
touching auth, the database, or checkpoints. Test on both **mobile** (this is a mobile-first app) and
desktop, and in an **incognito/private window** for anything login-related, so you're not accidentally
testing with a session already cached.

## 0. Infra / before you even open the browser

- [ ] `bun run build` and `bun run lint` are clean.
- [ ] Correct `.env` values are actually set on the deploy target (Railway Variables, or the
      school server's `.env` file) — `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
      `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME`, `NODE_ENV=production`.
- [ ] Postgres is reachable — schema pushed (`bun run db:push`) and admin seeded (`bun run db:seed`)
      against *this* database (a fresh DB doesn't inherit data from elsewhere).
- [ ] The site loads over **HTTPS** with a browser-trusted certificate (no "not private" warning).
- [ ] Check the process is actually still running a few minutes later, not just right after deploy
      (`systemctl status`, or Railway's deployment logs) — catches crash loops.

## 1. Guest (not logged in)

- [ ] Open the site in a private window. Bottom nav shows 4 tabs: ข้อมูลทั่วไป / แผนที่ / สแกน QR / อื่นๆ.
- [ ] **ข้อมูลทั่วไป** (`/`): market history text renders, progress card shows `0 / 7 จุด` / `0%`, all 7
      checkpoints listed as "ยังไม่สแกน".
- [ ] **แผนที่** (`/map`): shows the "กำลังจัดทำ" placeholder, no error.
- [ ] **สแกน QR** (`/scan`): browser prompts for camera permission; after allowing, video feed appears.
      The "กล้องใช้งานไม่ได้?" manual-entry box is visible below it.
- [ ] **อื่นๆ** (`/others`): shows project blurb, GitHub link (opens correct repo), "เข้าสู่ระบบ" and
      "สมัครสมาชิก" links (not "บัญชีของฉัน" — that's only for logged-in users).
- [ ] Visiting `/admin`, `/store`, or `/account` directly while logged out redirects to `/login`.

## 2. Checkpoint scanning

- [ ] **Manual entry**: type a real checkpoint's 6-digit code (see `src/lib/checkpoints.ts`) into the
      "กล้องใช้งานไม่ได้?" box → success toast fires **and** the checkpoint list below updates to
      "สแกนแล้ว" *without needing a refresh*.
- [ ] Submit the same code again → info toast ("สแกนไปแล้ว"), not counted twice, progress count
      unchanged.
- [ ] Submit an invalid 6-digit code (not one of the real ones) → error toast, nothing marked.
- [ ] **Camera scan**: point the camera at a real printed/displayed QR code for a checkpoint → same
      success behavior as manual entry, list updates instantly.
- [ ] After scanning 2–3 checkpoints, go to **ข้อมูลทั่วไป** → progress bar and count reflect the scans
      made from the Scan tab (state is shared across tabs, not per-page).
- [ ] Reload the page (guest, not logged in) → scans from `localStorage` persist.

## 3. Sign up — tourist (`user`) role

- [ ] `/others` → "สมัครสมาชิก". Fill name/email/password, leave role on "นักท่องเที่ยว / ผู้ใช้ทั่วไป".
- [ ] Submit with a **weak password** (< 8 chars, or missing a letter/number) → inline field error, no
      account created.
- [ ] Submit with an **email already registered** → "อีเมลนี้ถูกใช้งานแล้ว" error, no duplicate account.
- [ ] Submit valid data → redirected to `/verify-2fa`, subtitle shows the correct email address.
- [ ] Check the inbox for that email (or `RESEND_API_KEY` unset → check server logs) — 6-digit code
      arrives within a few seconds.
- [ ] Enter the code → redirected to `/account`. Enter a **wrong** code first → error shown, doesn't
      redirect; then enter the right one → succeeds.
- [ ] Any checkpoints scanned as a guest *before* signing up now show as scanned on `/account` (the
      local→account merge worked).

## 4. Sign up — store role

- [ ] Same flow as above, but choose "ผู้ประกอบการ / ร้านค้า" — a "ชื่อร้านค้า" field appears.
- [ ] Submitting with that field empty (or 1 character) → validation error, doesn't submit.
- [ ] After verifying the emailed code, lands on `/store` (not `/account`), showing the "กำลังพัฒนา"
      placeholder with the store's own name/subtitle.
- [ ] `/account` for this user shows a "ไปยังหน้าร้านค้า" link, and the store name as a badge.

## 5. Login (existing account, any role)

- [ ] Wrong password → "อีเมลหรือรหัสผ่านไม่ถูกต้อง", generic (doesn't reveal whether the email exists).
- [ ] Correct password → redirected to `/verify-2fa`, new code emailed.
- [ ] "ส่งรหัสอีกครั้ง" (resend) works once; clicking it again immediately (within 30s) is
      rate-limited with an error message instead of sending a second email.
- [ ] After verifying, landing page matches role: `user` → `/account`, `store` → `/store`,
      `admin` → `/admin`.
- [ ] Log out (button on `/account` or `/admin`), then confirm `/account` redirects to `/login` again.

## 6. Role gating (test with each role's account)

- [ ] `user`-role account visiting `/admin` → bounced to `/account`, not shown admin content.
- [ ] `user`-role account visiting `/store` → bounced to `/account`.
- [ ] `store`-role account visiting `/admin` → bounced to `/account`.
- [ ] `store`-role account visiting `/store` → allowed.
- [ ] `admin`-role account can visit `/admin` **and** `/store` (both allowed for admin).

## 7. Admin tools (`/admin`, logged in as admin)

- [ ] All 7 checkpoints listed with their 6-digit codes visible as text.
- [ ] Tapping the circle icon toggles a checkpoint's scanned state instantly (no refresh) — this
      affects the **admin's own account** only.
- [ ] Tapping the QR icon opens a dialog showing a scannable QR image for that checkpoint's code.
- [ ] "รีเซ็ตทั้งหมด" clears the admin's own progress back to `0 / 7`, with a confirmation toast.
- [ ] Resetting the admin's progress does **not** affect any other account's progress (check by
      logging in as a different user afterward).

## 8. Account page (`/account`, any role)

- [ ] Correct name, email, role badge, and (for store) store-name badge shown.
- [ ] Toggling "รับข่าวสารและกิจกรรมใหม่ๆ..." shows a toast, and the checkbox state survives a page
      reload (persisted to the account, not just local UI state).
- [ ] Progress card + checkpoint list here match what's shown on the Scan tab (same shared state).

## 9. Cross-cutting

- [ ] **Theming**: toggle the OS/browser between light and dark mode — text stays legible, no
      invisible text or broken contrast in either mode.
- [ ] **Mobile viewport** (real phone or devtools device emulation): bottom nav doesn't overlap
      content, safe-area padding looks correct (no content hidden behind a phone's home-bar).
- [ ] **Session persistence**: log in, close the browser tab entirely, reopen the site → still logged
      in (session cookie survives, doesn't expire immediately).
- [ ] **Multiple tabs**: log in on one tab, open a second tab to the same site → also logged in.
      Scan a checkpoint in one tab, switch to the other, reload → sees the update.

---

If something fails, note *which numbered step* and paste any console/network/server error you see —
that's usually enough to point straight at the cause.
