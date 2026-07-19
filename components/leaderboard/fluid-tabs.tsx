"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn, glassPanel } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export function FluidTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        glassPanel,
        "relative flex items-center gap-1 rounded-full p-1",
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="group relative rounded-full px-4 py-2.5 outline-none sm:px-5"
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-pill"
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 25,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full bg-primary shadow-[0_0_16px_-2px_var(--primary)]"
              />
            )}

            <motion.div
              animate={{
                filter: isActive
                  ? ["blur(0px)", "blur(4px)", "blur(0px)"]
                  : "blur(0px)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "relative z-10 flex items-center gap-2 text-sm font-medium sm:text-base",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              <motion.span
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex shrink-0 items-center justify-center"
              >
                {tab.icon}
              </motion.span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}
