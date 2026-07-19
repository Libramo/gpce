"use client";

import { motion } from "motion/react";

import type { CriteriaAverages } from "@/lib/evaluation-aggregate";
import { cn, glassPanel } from "@/lib/utils";

const CRITERIA_LABELS: { key: keyof CriteriaAverages; label: string }[] = [
  { key: "pertinence", label: "Pertinence" },
  { key: "approcheInnovante", label: "Approche innovante" },
  { key: "transferabilite", label: "Transférabilité" },
  { key: "rigueur", label: "Rigueur" },
  { key: "faisabilite", label: "Faisabilité" },
];

const MAX_CRITERION_SCORE = 4;

export function CriteriaBreakdown({
  averages,
}: {
  averages: CriteriaAverages;
}) {
  return (
    <div className={cn(glassPanel, "flex w-full flex-col gap-2 px-4 py-4")}>
      <span className="text-sm text-muted-foreground">
        Moyenne par critère
      </span>
      {CRITERIA_LABELS.map(({ key, label }) => {
        const value = averages[key];
        const pct = Math.min(100, (value / MAX_CRITERION_SCORE) * 100);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
              {label}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 24 }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
