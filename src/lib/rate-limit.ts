import "server-only";
import { headers } from "next/headers";

/**
 * In-memory sliding-window IP rate limiter for public server actions
 * (signup, login, OTP resend, feedback) — these had no throttle beyond
 * per-account login lockout, letting one IP hit them without limit (email-cost
 * abuse via repeated signups, login spraying across many accounts, feedback
 * spam). No Redis/Upstash in this stack, and this app runs as a single
 * instance, so a plain in-process Map is enough — it just means limits reset
 * on deploy/restart and don't share state across instances if this ever runs
 * behind more than one. Good enough for this project's scale; revisit if it
 * ever needs to scale horizontally.
 */
const buckets = new Map<string, number[]>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the caller (identified by IP) has exceeded `limit` calls to
 * `action` within `windowMs`, and records this call either way.
 */
export async function isRateLimited(action: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await clientIp();
  const key = `${action}:${ip}`;
  const now = Date.now();

  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  const limited = timestamps.length >= limit;
  if (!limited) timestamps.push(now);

  if (timestamps.length === 0) buckets.delete(key);
  else buckets.set(key, timestamps);

  return limited;
}
