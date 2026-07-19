"use client";

import { AnimatePresence } from "motion/react";

import type { JurorProgress } from "@/lib/leaderboard-types";

import { LeaderboardBar } from "./leaderboard-bar";

export function JurorBoard({
  jurors,
  onSelect,
}: {
  jurors: JurorProgress[];
  onSelect: (code: string) => void;
}) {
  const sorted = [...jurors].sort((a, b) => b.completed - a.completed);
  // Bars are scaled to the current leader, not the (much larger) total
  // assignment count — a bar-chart-race reads as progress relative to the
  // pack, not as a near-empty sliver against a distant finish line.
  const leader = Math.max(...sorted.map((j) => j.completed), 1);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <AnimatePresence initial={false}>
        {sorted.map((juror, i) => (
          <LeaderboardBar
            key={juror.code}
            rank={i + 1}
            label={juror.code}
            value={juror.completed}
            maxValue={leader}
            valueLabel={`${juror.completed}/${juror.total}`}
            onClick={() => onSelect(juror.code)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
