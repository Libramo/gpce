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

export function projectAverage(project: ProjectStanding): number | null {
  if (project.scores.length === 0) return null;
  const sum = project.scores.reduce((a, b) => a + b, 0);
  return sum / project.scores.length;
}
