"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { projectAverage, type ProjectStanding } from "@/lib/leaderboard-types";

import { BoardSearch } from "./board-search";
import { LeaderboardBar } from "./leaderboard-bar";

const RENDER_LIMIT = 30;

export function ProjectBoard({
  projects,
  onSelect,
}: {
  projects: ProjectStanding[];
  onSelect: (code: string) => void;
}) {
  const [query, setQuery] = useState("");

  // Rank is assigned from the full 200-project ranking, before search
  // filters the list — a search result still shows its true rank, not its
  // position within the filtered subset.
  const ranked = projects
    .map((project) => ({ project, average: projectAverage(project) }))
    .sort((a, b) => {
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    })
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  // Same leader-relative scaling as JurorBoard — a 14/20 average shouldn't
  // render as a merely-70%-full bar when it's actually the top score so far.
  const leader = Math.max(...ranked.map((r) => r.average ?? 0), 1);

  const filtered = query
    ? ranked.filter((r) =>
        r.project.code.toLowerCase().includes(query.toLowerCase())
      )
    : ranked;
  const visible = filtered.slice(0, RENDER_LIMIT);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <BoardSearch
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un dossier (ex. D42)…"
      />
      <AnimatePresence initial={false}>
        {visible.map(({ project, average, rank }) => (
          <LeaderboardBar
            key={project.code}
            rank={rank}
            label={project.code}
            value={average ?? 0}
            maxValue={leader}
            valueLabel={average !== null ? `${average.toFixed(1)}/20` : "—"}
            onClick={() => onSelect(project.code)}
          />
        ))}
      </AnimatePresence>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Aucun dossier trouvé.
        </p>
      )}
      {filtered.length > RENDER_LIMIT && (
        <p className="text-center text-xs text-muted-foreground">
          {filtered.length - RENDER_LIMIT} dossier(s) supplémentaire(s) —
          affinez la recherche pour les voir.
        </p>
      )}
    </div>
  );
}
