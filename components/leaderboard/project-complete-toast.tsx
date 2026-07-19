"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

export interface Celebration {
  id: string;
  projectCode: string;
}

export function ProjectCompleteToast({
  celebrations,
  onDismiss,
}: {
  celebrations: Celebration[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-3">
      <AnimatePresence>
        {celebrations.map((celebration) => (
          <ToastItem
            key={celebration.id}
            celebration={celebration}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  celebration,
  onDismiss,
}: {
  celebration: Celebration;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(celebration.id), 4000);
    return () => clearTimeout(timeout);
  }, [celebration.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-xl bg-linear-to-r from-primary to-primary/80 px-8 py-4 text-2xl font-bold text-primary-foreground shadow-[0_0_40px_-4px_var(--primary)] sm:text-3xl"
    >
      {celebration.projectCode} est complet 🎉
    </motion.div>
  );
}
