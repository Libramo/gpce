"use client";

import { AnimatePresence, motion } from "motion/react";

import type { Evaluation } from "@/lib/evaluation-types";
import { isEdit } from "@/lib/evaluation-aggregate";

export function ActivityTicker({
  evaluation,
}: {
  evaluation: Evaluation | null;
}) {
  if (!evaluation) return <div className="h-16" />;

  const edited = isEdit(evaluation);

  return (
    <div className="flex h-16 w-full items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={evaluation.id + evaluation.updatedAt}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="text-center text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          <span className="text-primary drop-shadow-[0_0_14px_var(--primary)]">
            {evaluation.jurorCode}
          </span>{" "}
          {edited ? (
            <>
              a modifié son évaluation de{" "}
              <span className="text-primary drop-shadow-[0_0_14px_var(--primary)]">
                {evaluation.projectCode}
              </span>
            </>
          ) : evaluation.meetsCriteria ? (
            <>
              vient de noter{" "}
              <span className="text-primary drop-shadow-[0_0_14px_var(--primary)]">
                {evaluation.projectCode}
              </span>
            </>
          ) : (
            <>
              a jugé{" "}
              <span className="text-primary drop-shadow-[0_0_14px_var(--primary)]">
                {evaluation.projectCode}
              </span>{" "}
              hors critères
            </>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
