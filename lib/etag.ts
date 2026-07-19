import { createHash } from "node:crypto";

/** Computes a weak ETag for a JSON-serializable payload — lets polling
 * clients skip re-downloading the full response when nothing changed
 * (see app/api/leaderboard, app/api/session-info). SHA-1 doesn't need to
 * be cryptographically strong here, just cheap and collision-resistant
 * enough for change detection — hashing the ~1MB worst-case
 * /api/leaderboard payload costs a few ms, negligible against Vercel's
 * Active CPU budget even at a 3s poll interval. */
export function computeEtag(payload: unknown): string {
  const hash = createHash("sha1").update(JSON.stringify(payload)).digest("hex");
  return `"${hash}"`;
}
