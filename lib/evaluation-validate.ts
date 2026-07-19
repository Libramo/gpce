import type { Evaluation } from "./evaluation-types";

/** Validates the mobile app's response at the boundary, before any
 * aggregation logic runs (see code-standards.md). Malformed records are
 * dropped rather than crashing the whole response — a handful of bad rows
 * from an evolving upstream API shouldn't take down the entire dashboard. */
function isEvaluation(value: unknown): value is Evaluation {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;

  return (
    typeof e.id === "string" &&
    typeof e.jurorCode === "string" &&
    typeof e.projectCode === "string" &&
    typeof e.meetsCriteria === "boolean" &&
    typeof e.createdAt === "string" &&
    typeof e.updatedAt === "string" &&
    (e.projectType === "individual" ||
      e.projectType === "group" ||
      e.projectType === null) &&
    isBooleanOrNull(e.documentIdentity) &&
    isBooleanOrNull(e.documentBulletin3) &&
    isBooleanOrNull(e.documentMotivationLetter) &&
    isNumberOrNull(e.pertinence) &&
    isNumberOrNull(e.approcheInnovante) &&
    isNumberOrNull(e.transferabilite) &&
    isNumberOrNull(e.rigueur) &&
    isNumberOrNull(e.faisabilite) &&
    (typeof e.recommendation === "string" || e.recommendation === null)
  );
}

function isBooleanOrNull(value: unknown): value is boolean | null {
  return typeof value === "boolean" || value === null;
}

function isNumberOrNull(value: unknown): value is number | null {
  return typeof value === "number" || value === null;
}

/** Accepts whatever shape the upstream API returned and extracts a valid
 * `Evaluation[]`, tolerating either a bare array or `{ evaluations: [...] }`. */
export function validateEvaluations(raw: unknown): Evaluation[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { evaluations?: unknown })?.evaluations)
      ? (raw as { evaluations: unknown[] }).evaluations
      : [];

  return list.filter(isEvaluation);
}
