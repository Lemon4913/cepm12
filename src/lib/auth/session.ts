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

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not set.");
}
const encodedKey = new TextEncoder().encode(secretKey);

type PendingStage = "setup" | "verify";

async function sign(payload: Record<string, unknown>, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/** Full authenticated session, created only after password + TOTP both succeed. */
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
      totpEnabled: users.totpEnabled,
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
    totpEnabled: row.totpEnabled,
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
 * Short-lived cookie used between "password verified" and "TOTP verified" (login),
 * or between "account created" and "TOTP enrolled" (signup). Never grants access on
 * its own — it only proves the password step already succeeded.
 */
export async function setPendingAuth(userId: string, stage: PendingStage) {
  const token = await sign({ sub: userId, stage }, `${PENDING_TTL_S}s`);
  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_TTL_S,
    path: "/",
  });
}

export async function getPendingAuth(): Promise<{ userId: string; stage: PendingStage } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_COOKIE)?.value;
  const payload = await verify(token);
  if (typeof payload?.sub !== "string" || typeof payload?.stage !== "string") return null;
  return { userId: payload.sub, stage: payload.stage as PendingStage };
}

export async function clearPendingAuth() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_COOKIE);
}
