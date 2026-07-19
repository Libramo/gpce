import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared frosted-glass surface: translucent card color + blur + soft
 * border/shadow. Used for every panel (KPI, stat tiles, leaderboard rows,
 * toasts) so they read as one consistent material over the ambient glow
 * background instead of flat solid boxes. */
export const glassPanel =
  "rounded-lg border border-border/60 bg-card/50 backdrop-blur-xl shadow-lg shadow-black/20"
