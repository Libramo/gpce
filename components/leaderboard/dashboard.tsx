"use client";

import { AlertTriangle, ListChecks, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_JUROR_COUNT,
  DEFAULT_PROJECT_COUNT,
  deriveCompletionProgress,
  deriveCompositionSplit,
  deriveCriteriaAverages,
  deriveJurorProgress,
  deriveProjectStandings,
  deriveStats,
  deriveWorstDocumentGap,
  generateJurorCodes,
  generateProjectCodes,
  getEvaluationsForJuror,
  getEvaluationsForProject,
  lastTouched,
} from "@/lib/evaluation-aggregate";
import type { Evaluation } from "@/lib/evaluation-types";
import { createEtagFetcher } from "@/lib/etag-fetcher";
import type { SessionInfo } from "@/lib/session-info-validate";

import { ActivityTicker } from "./activity-ticker";
import { CompletionBoard } from "./completion-board";
import { CompletionKpi } from "./completion-kpi";
import { CompositionStats } from "./composition-stats";
import { CriteriaBreakdown } from "./criteria-breakdown";
import { FluidTabs, type TabItem } from "./fluid-tabs";
import { JurorBoard } from "./juror-board";
import { JurorDetailContent } from "./juror-detail-content";
import {
  ProjectCompleteToast,
  type Celebration,
} from "./project-complete-toast";
import { ProjectBoard } from "./project-board";
import { ProjectCoverageContent } from "./project-coverage-content";
import { ProjectScoresContent } from "./project-scores-content";
import { StatTiles } from "./stat-tiles";

type View = "jurors" | "projects" | "completion";

const TABS: TabItem[] = [
  { id: "jurors", label: "Progression des jurés", icon: <Users size={20} /> },
  {
    id: "projects",
    label: "Classement des dossiers",
    icon: <Trophy size={20} />,
  },
  {
    id: "completion",
    label: "Complétion des dossiers",
    icon: <ListChecks size={20} />,
  },
];

const REFRESH_INTERVAL_MS = 3000;
// Roster changes (a juror added, a project added) are occasional, not
// continuous like evaluations — no need to hammer /health every 3s.
const SESSION_INFO_REFRESH_INTERVAL_MS = 30_000;

export function Dashboard() {
  const [view, setView] = useState<View>("jurors");
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Each fetcher owns its own ETag/data cache (see lib/etag-fetcher.ts) —
  // created once per mount, not per render, or there's nothing to compare
  // the next poll's response against.
  const fetchLeaderboard = useMemo(
    () => createEtagFetcher<{ evaluations: Evaluation[] }>(),
    [],
  );
  const fetchSessionInfo = useMemo(() => createEtagFetcher<SessionInfo>(), []);

  const { data, error, isLoading } = useSWR(
    "/api/leaderboard",
    fetchLeaderboard,
    { refreshInterval: REFRESH_INTERVAL_MS },
  );
  const evaluations = useMemo(() => data?.evaluations ?? [], [data]);

  // Falls back to the env-configured defaults until the first successful
  // /health fetch, or if it ever fails — see evaluation-aggregate.ts.
  const { data: sessionInfo } = useSWR(
    "/api/session-info",
    fetchSessionInfo,
    { refreshInterval: SESSION_INFO_REFRESH_INTERVAL_MS },
  );
  const jurorCount = sessionInfo?.jurorCount ?? DEFAULT_JUROR_COUNT;
  const projectCount = sessionInfo?.projectCount ?? DEFAULT_PROJECT_COUNT;
  const jurorCodes = useMemo(
    () => generateJurorCodes(jurorCount),
    [jurorCount],
  );
  const projectCodes = useMemo(
    () => generateProjectCodes(projectCount),
    [projectCount],
  );

  const latest = lastTouched(evaluations);

  const jurors = useMemo(
    () => deriveJurorProgress(evaluations, jurorCodes, projectCount),
    [evaluations, jurorCodes, projectCount],
  );
  const projects = useMemo(
    () => deriveProjectStandings(evaluations, projectCodes),
    [evaluations, projectCodes],
  );
  const completionProgress = useMemo(
    () => deriveCompletionProgress(evaluations, projectCodes),
    [evaluations, projectCodes],
  );

  // Tracks every project code we've already celebrated (or, on the very
  // first load, that was already complete before we ever saw it — see
  // below) so a page refresh doesn't replay old completions as if they
  // just happened, and an edit to an already-complete project's
  // evaluation can't re-trigger it either.
  const celebratedRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (evaluations.length === 0) return; // not loaded yet

    const newlyComplete = completionProgress.filter(
      (p) =>
        p.evaluatorCount === jurorCount && !celebratedRef.current.has(p.code),
    );

    if (!hasInitializedRef.current) {
      // First successful load: whatever's already complete is history, not
      // something that just happened. Record it as seen without
      // celebrating — this is exactly what stops a refresh from replaying
      // a stale "D2 est complet" toast for a completion that may have
      // happened minutes or hours ago.
      for (const p of newlyComplete) celebratedRef.current.add(p.code);
      hasInitializedRef.current = true;
      return;
    }

    if (newlyComplete.length === 0) return;

    setCelebrations((prev) => [
      ...prev,
      ...newlyComplete.map((p) => ({
        id: `${p.code}-${Date.now()}`,
        projectCode: p.code,
      })),
    ]);
    for (const p of newlyComplete) celebratedRef.current.add(p.code);
  }, [completionProgress, jurorCount, evaluations.length]);

  const dismissCelebration = useCallback((id: string) => {
    setCelebrations((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const stats = useMemo(
    () => deriveStats(evaluations, Date.now(), jurorCount, projectCount),
    [evaluations, jurorCount, projectCount],
  );
  const criteriaAverages = useMemo(
    () => deriveCriteriaAverages(evaluations),
    [evaluations],
  );
  const compositionSplit = useMemo(
    () => deriveCompositionSplit(evaluations),
    [evaluations],
  );
  const documentGap = useMemo(
    () => deriveWorstDocumentGap(evaluations),
    [evaluations],
  );

  const selectedEvaluations = useMemo(() => {
    if (!selectedCode) return [];
    return view === "jurors"
      ? getEvaluationsForJuror(evaluations, selectedCode)
      : getEvaluationsForProject(evaluations, selectedCode);
  }, [evaluations, selectedCode, view]);

  return (
    <div className="flex w-full flex-col gap-4 px-6 py-4">
      <ProjectCompleteToast
        celebrations={celebrations}
        onDismiss={dismissCelebration}
      />

      <ActivityTicker evaluation={latest} />

      {/* The browser page itself scrolls (see ui-context.md "Dashboard scroll
          model"); both columns flow at natural height. The sidebar is
          `sticky top-4`, so it pins near the top of the viewport while the
          taller leaderboard column scrolls past. This works precisely because
          NO ancestor between the sidebar and the scrolling root has
          `overflow: hidden` — that was what silently killed sticky before. */}
      <div className="grid w-full items-start gap-6 lg:grid-cols-[320px_1fr]">
        <div className="sticky top-4 flex flex-col gap-4">
          <CompletionKpi stats={stats} />
          <StatTiles stats={stats} />
          <CriteriaBreakdown averages={criteriaAverages} />
          <CompositionStats
            split={compositionSplit}
            documentGap={documentGap}
          />
        </div>

        <div className="flex flex-col rounded-xl border border-border/40 bg-card/20 backdrop-blur-md">
          {/* Sticky so the tab switcher stays reachable while the rows below
              it scroll past with the page. */}
          <div className="sticky top-4 z-10 flex justify-center rounded-t-xl border-b border-border/40  p-4 backdrop-blur-md">
            <FluidTabs
              tabs={TABS}
              active={view}
              onChange={(id) => setView(id as View)}
            />
          </div>

          <div className="w-full p-4">
            {error ? (
              <div className="flex flex-col items-center gap-2 pt-8 text-center">
                <AlertTriangle className="size-8 text-destructive" />
                <p className="text-lg font-medium">
                  Impossible de charger les données
                </p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            ) : isLoading ? (
              <p className="text-center text-lg text-muted-foreground">
                Chargement…
              </p>
            ) : view === "jurors" ? (
              <JurorBoard jurors={jurors} onSelect={setSelectedCode} />
            ) : view === "projects" ? (
              <ProjectBoard projects={projects} onSelect={setSelectedCode} />
            ) : (
              <CompletionBoard
                projects={completionProgress}
                jurorCount={jurorCount}
                onSelect={setSelectedCode}
              />
            )}
          </div>
        </div>
      </div>

      <span className="text-center text-xs text-muted-foreground">
        {error
          ? "Nouvelle tentative automatique…"
          : `Connecté à l'API en direct — actualisation toutes les ${REFRESH_INTERVAL_MS / 1000} s`}
      </span>

      <Dialog
        open={selectedCode !== null}
        onOpenChange={(open) => !open && setSelectedCode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCode}</DialogTitle>
          </DialogHeader>
          {selectedCode &&
            (view === "jurors" ? (
              <JurorDetailContent
                evaluations={selectedEvaluations}
                projectCodes={projectCodes}
              />
            ) : view === "projects" ? (
              <ProjectScoresContent evaluations={selectedEvaluations} />
            ) : (
              <ProjectCoverageContent
                evaluations={selectedEvaluations}
                jurorCodes={jurorCodes}
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
