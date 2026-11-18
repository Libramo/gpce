"use client";

import type { Evaluation } from "@/lib/evaluation-types";
import { scoreTotal } from "@/lib/evaluation-aggregate";
import { averageCountingIneligibleAsZero } from "@/lib/leaderboard-types";

export function ProjectScoresContent({
  evaluations,
}: {
  evaluations: Evaluation[];
}) {
  // Same rule as the ranking (lib/leaderboard-types.ts): "hors critères"
  // counts as 0/20, so the average here always matches the board.
  const totals = evaluations
    .map(scoreTotal)
    .filter((total): total is number => total !== null);
  const ineligibleCount = evaluations.length - totals.length;
  const average = averageCountingIneligibleAsZero(totals, ineligibleCount);

  // Scored jurors first (highest first), then the "hors critères" ones,
  // listed too so the room can see where the zeros in the average come from.
  const sorted = [...evaluations].sort(
    (a, b) => (scoreTotal(b) ?? -1) - (scoreTotal(a) ?? -1)
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">Moyenne</span>
        <span className="text-2xl font-bold tabular-nums">
          {average !== null ? `${average.toFixed(1)}/20` : "—"}
        </span>
      </div>

      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {sorted.map((evaluation) => (
          <div
            key={evaluation.id}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2"
          >
            <span className="font-mono font-medium">
              {evaluation.jurorCode}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {scoreTotal(evaluation) !== null
                ? `${scoreTotal(evaluation)}/20`
                : "Hors critères (0)"}
            </span>
          </div>
        ))}
        {evaluations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune évaluation pour l&apos;instant.
          </p>
        )}
      </div>

      {ineligibleCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {ineligibleCount} juré{ineligibleCount > 1 ? "s" : ""} sur{" "}
          {evaluations.length} ont jugé ce dossier hors critères (compté
          0/20 dans la moyenne).
        </p>
      )}
    </div>
  );
}
