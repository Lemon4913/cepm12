import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "cepm12_session";
const PENDING_COOKIE = "cepm12_pending";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PENDING_TTL_S = 10 * 60; // 10 minutes

// Computed lazily (not at module load) so importing this file — e.g. transitively, from
// any page that checks "is someone logged in?" — doesn't crash Next's build-time page
// data collection just because SESSION_SECRET isn't set in that environment yet. The
// error still surfaces immediately on the first real request that needs a session.
let cachedKey: Uint8Array | null = null;
function getEncodedKey() {
  if (cachedKey) return cachedKey;
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  cachedKey = new TextEncoder().encode(secretKey);
  return cachedKey;
}

async function sign(payload: Record<string, unknown>, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getEncodedKey());
}

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/** Full authenticated session, created only after password + emailed OTP code both succeed. */
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sessionId = crypto.randomUUID();

  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

  const token = await sign({ sid: sessionId }, "30d");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await verify(token);
  const sid = typeof payload?.sid === "string" ? payload.sid : null;
  if (!sid) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      storeName: users.storeName,
      newsOptIn: users.newsOptIn,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sid))
    .limit(1);

  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    storeName: row.storeName,
    newsOptIn: row.newsOptIn,
  };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await verify(token);
  const sid = typeof payload?.sid === "string" ? payload.sid : null;
  if (sid) {
    await db.delete(sessions).where(eq(sessions.id, sid));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Short-lived cookie used between "password verified" and "OTP code verified".
 * Never grants access on its own — it only proves the password step already succeeded
 * and says which account the emailed code was sent to.
 */
export async function setPendingAuth(userId: string) {
  const token = await sign({ sub: userId }, `${PENDING_TTL_S}s`);
  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_TTL_S,
    path: "/",
  });
}

export async function getPendingAuth(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_COOKIE)?.value;
  const payload = await verify(token);
  if (typeof payload?.sub !== "string") return null;
  return { userId: payload.sub };
}

export async function clearPendingAuth() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_COOKIE);
}
