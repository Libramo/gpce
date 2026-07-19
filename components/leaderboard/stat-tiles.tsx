import type { SessionStats } from "@/lib/evaluation-aggregate";
import { cn, glassPanel } from "@/lib/utils";

export function StatTiles({ stats }: { stats: SessionStats }) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <StatTile value={stats.pacePerMinute} label="évaluations / minute" />
      <StatTile value={stats.ineligibleCount} label="projets hors critères" />
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div
      className={cn(
        glassPanel,
        "flex flex-col items-center gap-1 px-4 py-4"
      )}
    >
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="text-center text-sm text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
