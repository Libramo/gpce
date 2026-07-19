"use client";

import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const TRANSITION_STYLE_ID = "theme-transition-styles";

const CIRCLE_REVEAL_CSS = `
  ::view-transition-group(root) {
    animation-duration: 0.7s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }

  ::view-transition-new(root) {
    animation-name: reveal-light;
  }

  ::view-transition-old(root),
  .dark::view-transition-old(root) {
    animation: none;
    z-index: -1;
  }

  .dark::view-transition-new(root) {
    animation-name: reveal-dark;
  }

  @keyframes reveal-dark {
    from {
      clip-path: circle(0% at 50% 50%);
    }
    to {
      clip-path: circle(100% at 50% 50%);
    }
  }

  @keyframes reveal-light {
    from {
      clip-path: circle(0% at 50% 50%);
    }
    to {
      clip-path: circle(100% at 50% 50%);
    }
  }
`;

export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);

    if (typeof window === "undefined") return;

    let styleElement = document.getElementById(
      TRANSITION_STYLE_ID
    ) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = TRANSITION_STYLE_ID;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = CIRCLE_REVEAL_CSS;

    const switchTheme = () => setTheme(theme === "light" ? "dark" : "light");

    if (!document.startViewTransition) {
      switchTheme();
      return;
    }
    document.startViewTransition(switchTheme);
  }, [theme, setTheme]);

  return { isDark, toggleTheme };
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <button
      type="button"
      className={cn(
        "bg-primary size-10 cursor-pointer rounded-full p-0 transition-all duration-300 active:scale-95",
        className
      )}
      onClick={toggleTheme}
      aria-label="Changer de thème"
    >
      <span className="sr-only">Changer de thème</span>
      <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.g
          animate={{ rotate: isDark ? -180 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        >
          <path
            d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5"
            fill="white"
          />
          <path
            d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5"
            fill="black"
          />
        </motion.g>
        <motion.path
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z"
          fill="white"
        />
      </svg>
    </button>
  );
}
