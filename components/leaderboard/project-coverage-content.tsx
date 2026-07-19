"use client";

import { Check, X } from "lucide-react";

import type { Evaluation } from "@/lib/evaluation-types";
import { cn } from "@/lib/utils";

export function ProjectCoverageContent({
  evaluations,
  jurorCodes,
}: {
  evaluations: Evaluation[];
  jurorCodes: string[];
}) {
  const evaluatedBy = new Set(evaluations.map((e) => e.jurorCode));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {jurorCodes.map((code) => {
        const done = evaluatedBy.has(code);
        return (
          <div
            key={code}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              done
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border/40 bg-muted/20 text-muted-foreground"
            )}
          >
            {done ? (
              <Check className="size-4 text-primary" />
            ) : (
              <X className="size-4" />
            )}
            <span className="font-mono">{code}</span>
          </div>
        );
      })}
    </div>
  );
}
