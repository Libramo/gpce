import { createHash } from "node:crypto";

/** Gates the dashboard page behind a single shared PIN (`DASHBOARD_PIN`) —
 * a deterrent against casual/unintended viewers (see the Vercel bandwidth
 * discussion in progress-tracker.md — every extra tab left open adds up),
 * not real security. Same bar as the mobile app's own admin PIN. Scoped
 * to the page only (see proxy.ts's matcher) — the API routes stay open,
 * a deliberate choice the user made knowingly. */

export const ACCESS_COOKIE_NAME = "gpce_access";
// 30 days: an event can span multiple days, and re-entering the PIN every
// session would be friction with no real security benefit at this bar.
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

/** Value to store in the access cookie once a correct PIN is submitted.
 * Deriving it from the PIN (rather than storing the PIN itself) means
 * rotating DASHBOARD_PIN automatically invalidates every previously
 * granted cookie — no separate revocation mechanism needed. */
export function computeAccessToken(pin: string): string {
  return hashPin(pin);
}

export function isValidAccessToken(token: string | undefined): boolean {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin || !token) return false;
  return token === hashPin(pin);
}
