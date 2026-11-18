export interface JurorProgress {
  code: string;
  completed: number;
  total: number;
}

export interface ProjectStanding {
  code: string;
  scores: number[];
  ineligibleCount: number;
}

/** A dossier's average over **every** juror who evaluated it, with each
 * "hors critères" (ineligible) answer counting as 0/20 (owner, 2026-11-18).
 * It used to skip them, so 1 juror at 17/20 + 11 "hors critères" ranked
 * first at 17.0; now that is (17 + 11×0) / 12 = 1.4. Null only when nobody
 * has evaluated the dossier yet (shown as not ranked, not a false 0). */
export function averageCountingIneligibleAsZero(
  scores: number[],
  ineligibleCount: number
): number | null {
  const evaluated = scores.length + ineligibleCount;
  if (evaluated === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / evaluated;
}

export function projectAverage(project: ProjectStanding): number | null {
  return averageCountingIneligibleAsZero(
    project.scores,
    project.ineligibleCount
  );
}
