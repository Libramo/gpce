"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

import type { SessionStats } from "@/lib/evaluation-aggregate";
import { cn, glassPanel } from "@/lib/utils";

export function CompletionKpi({ stats }: { stats: SessionStats }) {
  const pct =
    stats.totalExpected > 0
      ? Math.min(100, (stats.totalSubmitted / stats.totalExpected) * 100)
      : 0;

  const count = useSpring(0, { stiffness: 90, damping: 20 });
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    count.set(stats.totalSubmitted);
  }, [count, stats.totalSubmitted]);

  return (
    <div
      className={cn(
        glassPanel,
        "flex w-full flex-col items-center gap-2 px-4 py-5"
      )}
    >
      <motion.span className="text-5xl font-bold tabular-nums tracking-tight drop-shadow-[0_0_16px_var(--primary)]">
        {rounded}
      </motion.span>
      <span className="text-sm text-muted-foreground">
        / {stats.totalExpected} évaluations
      </span>
      <div className="relative mt-1 h-3 w-full overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-primary/80 to-primary shadow-[0_0_14px_-2px_var(--primary)]"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 24 }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {pct.toFixed(0)} % complété
      </span>
    </div>
  );
}
