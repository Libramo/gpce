import {
  DEFAULT_JUROR_COUNT,
  DEFAULT_PROJECT_COUNT,
  evaluatorCount,
  generateJurorCodes,
  generateProjectCodes,
} from "./evaluation-aggregate";
import type { Evaluation } from "./evaluation-types";

/** Dev-only simulated evaluation stream — stands in for the real
 * `/api/leaderboard` data while developing UI against something that
 * behaves like a live session. Not used once real data is wired up.
 * Uses the default roster size — the mock doesn't need to reflect a live
 * /health fetch, it's a fixed stand-in. */
const JUROR_COUNT = DEFAULT_JUROR_COUNT;
const JUROR_CODES = generateJurorCodes(DEFAULT_JUROR_COUNT);
const PROJECT_CODES = generateProjectCodes(DEFAULT_PROJECT_COUNT);

const CRITERIA_KEYS = [
  "pertinence",
  "approcheInnovante",
  "transferabilite",
  "rigueur",
  "faisabilite",
] as const;

/** The mock concentrates simulated activity on this many projects so
 * completions/celebrations stay frequent instead of diffusing evenly
 * across 200 — pacing only, mock-specific. */
const SPOTLIGHT_PROJECT_COUNT = 10;
const SPOTLIGHT_PROJECT_CODES = PROJECT_CODES.slice(0, SPOTLIGHT_PROJECT_COUNT);

function pairKey(jurorCode: string, projectCode: string) {
  return `${jurorCode}:${projectCode}`;
}

function randomId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function createEvaluation(
  jurorCode: string,
  projectCode: string,
  now: number
): Evaluation {
  const meetsCriteria = Math.random() > 0.1;
  const iso = new Date(now).toISOString();

  return {
    id: randomId(),
    jurorCode,
    projectCode,
    meetsCriteria,
    projectType: meetsCriteria
      ? Math.random() > 0.6
        ? "group"
        : "individual"
      : null,
    documentIdentity: meetsCriteria ? Math.random() > 0.12 : null,
    documentBulletin3: meetsCriteria ? Math.random() > 0.2 : null,
    documentMotivationLetter: meetsCriteria ? Math.random() > 0.15 : null,
    pertinence: meetsCriteria ? Math.floor(Math.random() * 5) : null,
    approcheInnovante: meetsCriteria ? Math.floor(Math.random() * 5) : null,
    transferabilite: meetsCriteria ? Math.floor(Math.random() * 5) : null,
    rigueur: meetsCriteria ? Math.floor(Math.random() * 5) : null,
    faisabilite: meetsCriteria ? Math.floor(Math.random() * 5) : null,
    recommendation: null,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** Simulates a session already partway through, with timestamps spread
 * over the last ~20 minutes so pace/ticker have something to work with
 * immediately instead of starting from an empty room. A fraction of
 * records look already-edited (updatedAt well after createdAt) for
 * realism. */
export function seedInitialEvaluations(): Evaluation[] {
  const seeded = new Set<string>();
  const evaluations: Evaluation[] = [];
  const now = Date.now();
  const targetCount = 300;

  while (evaluations.length < targetCount) {
    const jurorCode = JUROR_CODES[Math.floor(Math.random() * JUROR_COUNT)];
    const projectCode =
      PROJECT_CODES[Math.floor(Math.random() * PROJECT_CODES.length)];
    const key = pairKey(jurorCode, projectCode);
    if (seeded.has(key)) continue;
    seeded.add(key);

    const createdAt = now - Math.floor(Math.random() * 20 * 60 * 1000);
    const evaluation = createEvaluation(jurorCode, projectCode, createdAt);
    if (Math.random() < 0.15) {
      evaluation.updatedAt = new Date(
        createdAt + Math.floor(Math.random() * 5 * 60 * 1000)
      ).toISOString();
    }
    evaluations.push(evaluation);
  }

  // Deliberately leave most spotlight projects exactly one juror away from
  // complete — otherwise the "project complete" celebration could
  // realistically take minutes to occur by chance, since evaluators are
  // spread across 200 projects and only 10 are ever spotlighted. This way
  // several fire in the first minute instead of relying on luck.
  const spotlightProjects = SPOTLIGHT_PROJECT_CODES.slice(0, 8);
  const seededEvaluations = evaluations.filter(
    (e) => !spotlightProjects.includes(e.projectCode)
  );
  spotlightProjects.forEach((projectCode, i) => {
    const missingJuror = JUROR_CODES[i % JUROR_COUNT];
    const spotlightJurors = JUROR_CODES.filter((j) => j !== missingJuror);
    for (const jurorCode of spotlightJurors) {
      seededEvaluations.push(
        createEvaluation(
          jurorCode,
          projectCode,
          now - Math.floor(Math.random() * 60_000)
        )
      );
    }
  });

  return seededEvaluations.sort(
    (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
  );
}

/** Picks the next juror/project pair to evaluate. Instead of picking
 * uniformly at random across all 200 projects — which spreads coverage so
 * thin that any single project rarely reaches full juror coverage in a
 * short demo — this prefers projects that are already closest to
 * complete, and is weighted toward the spotlight projects so completions
 * (and celebrations) stay frequent rather than diffusing across 200. */
function pickNextPair(
  existing: Evaluation[]
): { jurorCode: string; projectCode: string } | null {
  const useSpotlightPool = Math.random() < 0.65;
  const primaryPool = useSpotlightPool ? SPOTLIGHT_PROJECT_CODES : PROJECT_CODES;
  return (
    pickFromNearestToCompletion(existing, primaryPool) ??
    pickFromNearestToCompletion(existing, PROJECT_CODES)
  );
}

function pickFromNearestToCompletion(
  existing: Evaluation[],
  candidateProjects: readonly string[]
): { jurorCode: string; projectCode: string } | null {
  let best: { jurorCode: string; projectCode: string; evaluatorCount: number } | null =
    null;

  for (const projectCode of candidateProjects) {
    const evaluators = new Set(
      existing
        .filter((e) => e.projectCode === projectCode)
        .map((e) => e.jurorCode)
    );
    if (evaluators.size >= JUROR_COUNT) continue;

    const remainingJurors = JUROR_CODES.filter((j) => !evaluators.has(j));
    if (!best || evaluators.size > best.evaluatorCount) {
      const jurorCode =
        remainingJurors[Math.floor(Math.random() * remainingJurors.length)];
      best = { jurorCode, projectCode, evaluatorCount: evaluators.size };
    }
  }

  return best ? { jurorCode: best.jurorCode, projectCode: best.projectCode } : null;
}

/** Mock-only: once every spotlight project has reached full juror
 * coverage, there's nothing left in the simulation's favored pool to
 * complete, so the celebration toast would go quiet for long stretches —
 * a one-time burst, not an ongoing demo. Recycling one spotlight project
 * back to 11/12 keeps the celebration loop alive indefinitely. A real
 * session never needs this (evaluations only ever approach completion,
 * never regress) — this exists purely so the demo doesn't run dry. */
function recycleASpotlightProjectIfAllComplete(
  evaluations: Evaluation[]
): Evaluation[] {
  const allComplete = SPOTLIGHT_PROJECT_CODES.every(
    (code) => evaluatorCount(evaluations, code) >= JUROR_COUNT
  );
  if (!allComplete) return evaluations;

  const projectCode =
    SPOTLIGHT_PROJECT_CODES[
      Math.floor(Math.random() * SPOTLIGHT_PROJECT_CODES.length)
    ];
  const jurorToRemove = JUROR_CODES[Math.floor(Math.random() * JUROR_COUNT)];

  return evaluations.filter(
    (e) => !(e.projectCode === projectCode && e.jurorCode === jurorToRemove)
  );
}

/** One simulated tick: most of the time a juror scores a project they
 * haven't touched yet; sometimes (real evaluations are editable) an
 * existing record gets revised in place instead — same id, new
 * updatedAt, matching how the mobile app's edit flow actually behaves. */
export function tick(evaluationsIn: Evaluation[], now: number): Evaluation[] {
  const evaluations = recycleASpotlightProjectIfAllComplete(evaluationsIn);
  const shouldEdit = evaluations.length > 0 && Math.random() < 0.25;

  if (shouldEdit) {
    const index = Math.floor(Math.random() * evaluations.length);
    const target = evaluations[index];
    const updated: Evaluation = { ...target, updatedAt: new Date(now).toISOString() };
    if (updated.meetsCriteria) {
      const key = CRITERIA_KEYS[Math.floor(Math.random() * CRITERIA_KEYS.length)];
      updated[key] = Math.floor(Math.random() * 5);
    }
    const next = [...evaluations];
    next[index] = updated;
    return next;
  }

  const pair = pickNextPair(evaluations);
  if (!pair) return evaluations;
  return [...evaluations, createEvaluation(pair.jurorCode, pair.projectCode, now)];
}
