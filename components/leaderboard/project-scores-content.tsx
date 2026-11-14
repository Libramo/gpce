"use client";

import type { Evaluation } from "@/lib/evaluation-types";
import { scoreTotal } from "@/lib/evaluation-aggregate";

export function ProjectScoresContent({
  evaluations,
}: {
  evaluations: Evaluation[];
}) {
  const scored = evaluations.filter((e) => e.meetsCriteria);
  const ineligibleCount = evaluations.length - scored.length;
  const average =
    scored.length > 0
      ? scored.reduce((sum, e) => sum + (scoreTotal(e) ?? 0), 0) / scored.length
      : null;

  const sorted = [...scored].sort(
    (a, b) => (scoreTotal(b) ?? 0) - (scoreTotal(a) ?? 0)
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
              {scoreTotal(evaluation)}/20
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
          {evaluations.length} ont jugé ce dossier hors critères.
        </p>
      )}
    </div>
  );
}
