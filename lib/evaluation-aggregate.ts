import type { Evaluation } from "./evaluation-types";
import type { JurorProgress, ProjectStanding } from "./leaderboard-types";

/** Pure aggregation logic over an `Evaluation[]` — used both by the real
 * `/api/leaderboard` route (against real data) and, during development,
 * against `lib/mock-evaluations.ts`'s simulated stream. Nothing in this
 * file is mock-specific; it's the actual product logic. */

/** Used only before the first successful `/api/session-info` fetch (which
 * proxies the mobile app's `/health`), or if that ever fails — the live
 * roster size from `/health` is the real source of truth, fetched by
 * `Dashboard` and threaded through as `jurorCount`/`projectCount`
 * parameters below, not read from a module constant. `NEXT_PUBLIC_`
 * because this module runs client-side. */
export const DEFAULT_JUROR_COUNT =
  Number(process.env.NEXT_PUBLIC_JUROR_COUNT) || 12;
export const DEFAULT_PROJECT_COUNT =
  Number(process.env.NEXT_PUBLIC_PROJECT_COUNT) || 200;

export function generateJurorCodes(jurorCount: number): string[] {
  return Array.from({ length: jurorCount }, (_, i) => `J${i + 1}`);
}

// Real dossier codes are NOT zero-padded ("D13", "D7", "D200"), unlike the
// mock's original assumption. They were P1..P200 until 2026-11-14, when the
// mobile app renamed projects to "dossiers"; must match GPCE-app's
// DOSSIER_CODES (src/lib/codes.ts) or nothing lines up.
export function generateProjectCodes(projectCount: number): string[] {
  return Array.from({ length: projectCount }, (_, i) => `D${i + 1}`);
}

/** Numeric-aware comparator for project codes — a plain string sort would
 * put "D10" before "D2" (lexicographic), which reads wrong for codes that
 * aren't zero-padded. */
export function compareProjectCodes(a: string, b: string): number {
  const numA = Number.parseInt(a.slice(1), 10);
  const numB = Number.parseInt(b.slice(1), 10);
  return numA - numB;
}

const CRITERIA_KEYS = [
  "pertinence",
  "approcheInnovante",
  "transferabilite",
  "rigueur",
  "faisabilite",
] as const;
type CriteriaKey = (typeof CRITERIA_KEYS)[number];

export function scoreTotal(evaluation: Evaluation): number | null {
  if (!evaluation.meetsCriteria) return null;
  let sum = 0;
  for (const key of CRITERIA_KEYS) {
    const value = evaluation[key];
    if (value === null) return null;
    sum += value;
  }
  return sum;
}

export function deriveJurorProgress(
  evaluations: Evaluation[],
  jurorCodes: string[],
  projectCount: number
): JurorProgress[] {
  const counts = new Map<string, number>();
  for (const evaluation of evaluations) {
    counts.set(evaluation.jurorCode, (counts.get(evaluation.jurorCode) ?? 0) + 1);
  }
  return jurorCodes.map((code) => ({
    code,
    completed: counts.get(code) ?? 0,
    total: projectCount,
  }));
}

export function deriveProjectStandings(
  evaluations: Evaluation[],
  projectCodes: string[]
): ProjectStanding[] {
  const byProject = new Map<string, ProjectStanding>();
  for (const code of projectCodes) {
    byProject.set(code, { code, scores: [], ineligibleCount: 0 });
  }

  for (const evaluation of evaluations) {
    const standing = byProject.get(evaluation.projectCode);
    if (!standing) continue;
    const total = scoreTotal(evaluation);
    if (total !== null) {
      standing.scores.push(total);
    } else {
      standing.ineligibleCount += 1;
    }
  }

  return projectCodes.map((code) => byProject.get(code)!);
}

export interface SessionStats {
  totalSubmitted: number;
  totalExpected: number;
  pacePerMinute: number;
  ineligibleCount: number;
}

export function deriveStats(
  evaluations: Evaluation[],
  now: number,
  jurorCount: number,
  projectCount: number
): SessionStats {
  const oneMinuteAgo = now - 60_000;
  const pacePerMinute = evaluations.filter(
    (e) => Date.parse(e.updatedAt) >= oneMinuteAgo
  ).length;
  const ineligibleCount = evaluations.filter((e) => !e.meetsCriteria).length;

  return {
    totalSubmitted: evaluations.length,
    totalExpected: jurorCount * projectCount,
    pacePerMinute,
    ineligibleCount,
  };
}

/** Most recently touched record — a new submission or an edit, whichever
 * happened last. Can't assume "last in the array" once edits mutate
 * existing entries in place, so this scans by updatedAt explicitly. */
export function lastTouched(evaluations: Evaluation[]): Evaluation | null {
  if (evaluations.length === 0) return null;
  return evaluations.reduce((latest, e) =>
    Date.parse(e.updatedAt) > Date.parse(latest.updatedAt) ? e : latest
  );
}

/** Real API data confirmed createdAt/updatedAt are written in two separate
 * steps — even a fresh submission typically shows a few tens of
 * milliseconds of drift between them (sometimes updatedAt even lands
 * *before* createdAt). Exact equality is too strict; only a gap clearly
 * larger than that write jitter counts as a genuine edit. */
const EDIT_THRESHOLD_MS = 1000;

export function isEdit(evaluation: Evaluation): boolean {
  return (
    Date.parse(evaluation.updatedAt) - Date.parse(evaluation.createdAt) >
    EDIT_THRESHOLD_MS
  );
}

/** Number of distinct jurors who have evaluated a project — "complete"
 * means every juror has weighed in, matching the mobile app's invariant
 * that an ineligible determination still counts as done. */
export function evaluatorCount(
  evaluations: Evaluation[],
  projectCode: string
): number {
  return new Set(
    evaluations.filter((e) => e.projectCode === projectCode).map((e) => e.jurorCode)
  ).size;
}

export interface CriteriaAverages {
  pertinence: number;
  approcheInnovante: number;
  transferabilite: number;
  rigueur: number;
  faisabilite: number;
}

export function deriveCriteriaAverages(
  evaluations: Evaluation[]
): CriteriaAverages {
  const eligible = evaluations.filter((e) => e.meetsCriteria);
  const average = (key: CriteriaKey) => {
    if (eligible.length === 0) return 0;
    const sum = eligible.reduce((acc, e) => acc + (e[key] ?? 0), 0);
    return sum / eligible.length;
  };
  return {
    pertinence: average("pertinence"),
    approcheInnovante: average("approcheInnovante"),
    transferabilite: average("transferabilite"),
    rigueur: average("rigueur"),
    faisabilite: average("faisabilite"),
  };
}

export function deriveCompositionSplit(evaluations: Evaluation[]): {
  individual: number;
  group: number;
} {
  let individual = 0;
  let group = 0;
  for (const e of evaluations) {
    if (e.projectType === "individual") individual += 1;
    else if (e.projectType === "group") group += 1;
  }
  return { individual, group };
}

export interface DocumentGap {
  label: string;
  missingCount: number;
}

const DOCUMENT_LABELS: Record<
  "documentIdentity" | "documentBulletin3" | "documentMotivationLetter",
  string
> = {
  documentIdentity: "Pièce d'identité",
  documentBulletin3: "Bulletin n°3",
  documentMotivationLetter: "Lettre de motivation",
};

/** The single document type missing most often, i.e. the one worth
 * flagging to organizers first. Only counts explicit `false` — `null`
 * means "not confirmed missing," not "missing" (see evaluation-types.ts). */
export function deriveWorstDocumentGap(
  evaluations: Evaluation[]
): DocumentGap | null {
  const counts = {
    documentIdentity: 0,
    documentBulletin3: 0,
    documentMotivationLetter: 0,
  };
  for (const e of evaluations) {
    if (e.documentIdentity === false) counts.documentIdentity += 1;
    if (e.documentBulletin3 === false) counts.documentBulletin3 += 1;
    if (e.documentMotivationLetter === false) counts.documentMotivationLetter += 1;
  }

  const [worstKey, worstCount] = (
    Object.entries(counts) as [keyof typeof counts, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  if (worstCount === 0) return null;
  return { label: DOCUMENT_LABELS[worstKey], missingCount: worstCount };
}

export interface ProjectCompletion {
  code: string;
  evaluatorCount: number;
}

/** Persistent juror-coverage progress across every project in the roster —
 * unlike the celebration toast (a transient flash), this is always visible
 * so the room can check completion status at any time, not just catch it
 * live. */
export function deriveCompletionProgress(
  evaluations: Evaluation[],
  projectCodes: string[]
): ProjectCompletion[] {
  return projectCodes.map((code) => ({
    code,
    evaluatorCount: evaluatorCount(evaluations, code),
  }));
}

export function getEvaluationsForProject(
  evaluations: Evaluation[],
  projectCode: string
): Evaluation[] {
  return evaluations.filter((e) => e.projectCode === projectCode);
}

export function getEvaluationsForJuror(
  evaluations: Evaluation[],
  jurorCode: string
): Evaluation[] {
  return evaluations.filter((e) => e.jurorCode === jurorCode);
}
