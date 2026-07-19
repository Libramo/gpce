export interface SessionInfo {
  jurorCount: number;
  projectCount: number;
}

/** The mobile app's /health endpoint returns counts as strings
 * (`{"jurorCount":"12","projectCount":"200"}`, confirmed 2026-07-16) —
 * parse defensively rather than assuming a shape. Returns null if the
 * response doesn't contain usable numbers, so the caller can fall back to
 * its own defaults instead of propagating NaN through the whole app. */
export function validateSessionInfo(raw: unknown): SessionInfo | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const jurorCount = toPositiveInt(r.jurorCount);
  const projectCount = toPositiveInt(r.projectCount);
  if (jurorCount === null || projectCount === null) return null;

  return { jurorCount, projectCount };
}

function toPositiveInt(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  if (typeof num !== "number" || !Number.isFinite(num) || num <= 0) {
    return null;
  }
  return Math.trunc(num);
}
