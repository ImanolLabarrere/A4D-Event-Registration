import crypto from "crypto";

/**
 * Generates a cryptographically random session token.
 * Returns a 64-character lowercase hexadecimal string (32 bytes).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Returns the session expiry date: now + SESSION_TTL_HOURS (default 8 h).
 */
export function sessionExpiresAt(): Date {
  const hours = Number(process.env.SESSION_TTL_HOURS ?? 8);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
