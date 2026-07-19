"use client";

import { Trophy } from "lucide-react";
import { motion } from "motion/react";

import { cn, glassPanel } from "@/lib/utils";

const PODIUM_STYLES: Record<number, { badge: string; row: string }> = {
  1: {
    badge: "bg-primary text-primary-foreground drop-shadow-[0_0_14px_var(--primary)]",
    row: "border-primary/60 shadow-[0_0_28px_-8px_var(--primary)]",
  },
  2: {
    badge: "bg-primary/25 text-primary drop-shadow-[0_0_8px_var(--primary)]",
    row: "border-primary/30",
  },
  3: {
    badge: "bg-primary/10 text-primary/90",
    row: "border-primary/15",
  },
};

export function LeaderboardBar({
  rank,
  label,
  value,
  maxValue,
  valueLabel,
  onClick,
}: {
  rank: number;
  label: string;
  value: number;
  maxValue: number;
  valueLabel: string;
  onClick?: () => void;
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  const podium = PODIUM_STYLES[rank];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
      className={cn(
        glassPanel,
        "flex w-full items-center gap-4 px-4 py-3 text-left",
        onClick && "cursor-pointer transition-colors hover:bg-card/80",
        podium?.row
      )}
    >
      <span
        className={cn(
          "flex w-10 shrink-0 items-center justify-center rounded-full font-mono text-xl",
          podium ? podium.badge : "text-muted-foreground"
        )}
      >
        {rank === 1 ? <Trophy className="size-5" /> : rank}
      </span>
      <span className="w-28 shrink-0 font-mono text-2xl font-bold">
        {label}
      </span>
      <div className="relative h-10 flex-1 overflow-hidden rounded-md bg-muted/40">
        <motion.div
          className="h-full rounded-md bg-linear-to-r from-primary/80 to-primary shadow-[0_0_18px_-2px_var(--primary)]"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-2xl text-muted-foreground tabular-nums">
        {valueLabel}
      </span>
    </motion.button>
  );
}
