"use client";

import { motion } from "motion/react";

/** Slow, subtle drift on the ambient glow blobs — a static gradient reads as
 * a background image; a barely-moving one reads as alive, without being
 * distracting behind a live-updating leaderboard. */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-[-12%] h-140 w-225 -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, 20, -10, 0],
          opacity: [0.9, 1, 0.85, 0.9],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-18%] right-[-8%] h-120 w-120 rounded-full bg-primary/15 blur-[140px]"
        animate={{ x: [0, -30, 20, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-8%] h-95 w-95 rounded-full bg-accent/20 blur-[120px]"
        animate={{ x: [0, 25, -15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
