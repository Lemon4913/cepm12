import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../src/db/schema";

// Note: this script is run standalone via `bun run`, not through Next.js's
// bundler, so it can't import anything that pulls in the "server-only" guard
// (src/db, src/lib/auth/password.ts) — it talks to the database directly.
function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (in .env) before running the seed script.");
  process.exit(1);
}

const client = createClient({ url: `file:${process.env.DATABASE_URL ?? "app.sqlite"}` });
const db = drizzle(client);

const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
if (existing.length > 0) {
  console.log(`Admin account already exists for ${email}. Nothing to do.`);
  process.exit(0);
}

const passwordHash = await hashPassword(password);
await db.insert(users).values({
  id: crypto.randomUUID(),
  email,
  passwordHash,
  name,
  role: "admin",
  newsOptIn: false,
});

console.log(`Created admin account for ${email}.`);
console.log("Log in with that email/password — a 6-digit code will be emailed to you to finish logging in.");
