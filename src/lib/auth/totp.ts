import "server-only";
import { authenticator } from "otplib";

// Accept a code from one step before/after the current one to tolerate clock drift.
authenticator.options = { window: 1 };

const ISSUER = "Talat Tha Na";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.check(token.trim(), secret);
  } catch {
    return false;
  }
}
