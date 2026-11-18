"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";

import type { ProjectCompletion } from "@/lib/evaluation-aggregate";

import { BoardSearch } from "./board-search";
import { LeaderboardBar } from "./leaderboard-bar";

export function CompletionBoard({
  projects,
  jurorCount,
  onSelect,
}: {
  projects: ProjectCompletion[];
  jurorCount: number;
  onSelect: (code: string) => void;
}) {
  const [query, setQuery] = useState("");

  const ranked = [...projects]
    .sort((a, b) => b.evaluatorCount - a.evaluatorCount)
    .map((project, i) => ({ project, rank: i + 1 }));

  const filtered = query
    ? ranked.filter((r) =>
        r.project.code.toLowerCase().includes(query.toLowerCase())
      )
    : ranked;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <BoardSearch
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un dossier (ex. D42)…"
      />
      <AnimatePresence initial={false}>
        {filtered.map(({ project, rank }) => (
          <LeaderboardBar
            key={project.code}
            rank={rank}
            label={project.code}
            value={project.evaluatorCount}
            maxValue={jurorCount}
            valueLabel={
              project.evaluatorCount === jurorCount
                ? "Complet"
                : `${project.evaluatorCount}/${jurorCount}`
            }
            onClick={() => onSelect(project.code)}
          />
        ))}
      </AnimatePresence>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Aucun dossier trouvé.
        </p>
      )}
    </div>
  );
}
