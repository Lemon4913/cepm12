import "server-only";
import { createHmac, randomInt } from "node:crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getHmacKey() {
  const key = process.env.SESSION_SECRET;
  if (!key) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return key;
}

export function generateOtpCode(): string {
  // 6-digit code, zero-padded. randomInt is cryptographically secure.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** HMAC, not a plain hash — so a leaked otp_code_hash column is useless without SESSION_SECRET too. */
export function hashOtpCode(code: string): string {
  return createHmac("sha256", getHmacKey()).update(code.trim()).digest("hex");
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function verifyOtpCode(code: string, storedHash: string, expiresAt: Date): boolean {
  if (expiresAt.getTime() < Date.now()) return false;
  return hashOtpCode(code) === storedHash;
}
