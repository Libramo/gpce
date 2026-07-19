import type { DocumentGap } from "@/lib/evaluation-aggregate";
import { cn, glassPanel } from "@/lib/utils";

export function CompositionStats({
  split,
  documentGap,
}: {
  split: { individual: number; group: number };
  documentGap: DocumentGap | null;
}) {
  const total = split.individual + split.group;
  const individualPct = total > 0 ? (split.individual / total) * 100 : 50;

  return (
    <div className={cn(glassPanel, "flex w-full flex-col gap-3 px-4 py-4")}>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Individuel ({split.individual})</span>
          <span>Collectif ({split.group})</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full bg-primary"
            style={{ width: `${individualPct}%` }}
          />
          <div className="h-full flex-1 bg-primary/30" />
        </div>
      </div>

      <div className="border-t border-border/50 pt-2 text-xs text-muted-foreground">
        {documentGap ? (
          <>
            Document le plus souvent manquant :{" "}
            <span className="font-medium text-foreground">
              {documentGap.label}
            </span>{" "}
            ({documentGap.missingCount})
          </>
        ) : (
          "Aucun document manquant signalé"
        )}
      </div>
    </div>
  );
}
