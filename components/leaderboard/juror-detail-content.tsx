"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { Evaluation } from "@/lib/evaluation-types";
import { compareProjectCodes, scoreTotal } from "@/lib/evaluation-aggregate";
import { cn } from "@/lib/utils";

import { BoardSearch } from "./board-search";

const CRITERIA: { key: "pertinence" | "approcheInnovante" | "transferabilite" | "rigueur" | "faisabilite"; label: string }[] = [
  { key: "pertinence", label: "Pertinence" },
  { key: "approcheInnovante", label: "Approche innovante" },
  { key: "transferabilite", label: "Transférabilité" },
  { key: "rigueur", label: "Rigueur" },
  { key: "faisabilite", label: "Faisabilité" },
];

export function JurorDetailContent({
  evaluations,
  projectCodes,
}: {
  evaluations: Evaluation[];
  projectCodes: string[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRemaining, setShowRemaining] = useState(false);
  const [remainingQuery, setRemainingQuery] = useState("");

  const scored = evaluations.filter((e) => e.meetsCriteria);
  const average =
    scored.length > 0
      ? scored.reduce((sum, e) => sum + (scoreTotal(e) ?? 0), 0) / scored.length
      : null;

  const sorted = [...evaluations].sort((a, b) =>
    compareProjectCodes(a.projectCode, b.projectCode)
  );

  const scoredCodes = new Set(evaluations.map((e) => e.projectCode));
  const remainingCodes = projectCodes.filter((code) => !scoredCodes.has(code));
  const filteredRemaining = remainingQuery
    ? remainingCodes.filter((code) =>
        code.toLowerCase().includes(remainingQuery.toLowerCase())
      )
    : remainingCodes;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Moyenne donnée ({scored.length} évaluation
          {scored.length > 1 ? "s" : ""} notée{scored.length > 1 ? "s" : ""})
        </span>
        <span className="text-2xl font-bold tabular-nums">
          {average !== null ? `${average.toFixed(1)}/20` : "—"}
        </span>
      </div>

      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {sorted.map((evaluation) => {
          const total = scoreTotal(evaluation);
          const isExpanded = expandedId === evaluation.id;
          return (
            <div
              key={evaluation.id}
              className="rounded-lg border border-border/50 bg-card/40"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : evaluation.id)
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left"
              >
                <span className="font-mono font-medium">
                  {evaluation.projectCode}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {evaluation.meetsCriteria ? `${total}/20` : "Hors critères"}
                  {evaluation.meetsCriteria && (
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </span>
              </button>
              {isExpanded && evaluation.meetsCriteria && (
                <div className="flex flex-col gap-1 border-t border-border/50 px-3 py-2">
                  {CRITERIA.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span>{label}</span>
                      <span className="tabular-nums">
                        {evaluation[key]}/4
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {evaluations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune évaluation pour l&apos;instant.
          </p>
        )}
      </div>

      <div className="border-t border-border/50 pt-3">
        <button
          type="button"
          onClick={() => setShowRemaining((prev) => !prev)}
          className="flex w-full items-center justify-between text-sm text-muted-foreground"
        >
          <span>{remainingCodes.length} dossier(s) restant(s) à évaluer</span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              showRemaining && "rotate-180"
            )}
          />
        </button>

        {showRemaining && (
          <div className="mt-2 flex flex-col gap-2">
            <BoardSearch
              value={remainingQuery}
              onChange={setRemainingQuery}
              placeholder="Rechercher un dossier restant…"
            />
            <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {filteredRemaining.map((code) => (
                <div
                  key={code}
                  className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5 text-center font-mono text-sm text-muted-foreground"
                >
                  {code}
                </div>
              ))}
            </div>
            {filteredRemaining.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Aucun dossier trouvé.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
