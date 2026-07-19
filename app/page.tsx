import Image from "next/image";

import { AmbientBackground } from "@/components/ambient-background";
import { Dashboard } from "@/components/leaderboard/dashboard";
import { ThemeToggleButton } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background text-foreground">
      <AmbientBackground />

      <div className="fixed right-4 top-4 z-20">
        <ThemeToggleButton />
      </div>
      <div className="relative z-10 flex shrink-0 items-center justify-center gap-4 pt-6 sm:gap-8">
        <Image
          src="/logo-gpce.png"
          alt="GPCE"
          width={56}
          height={56}
          className="h-30 w-30  sm:h-14 sm:w-14"
          priority
        />
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Suivi en direct GPCE
          </h1>
          <h2 className="text-lg text-muted-foreground">Édition 2026</h2>
        </div>
        <Image
          src="/logo-anph.png"
          alt="ANPH"
          width={56}
          height={56}
          className="h-30 w-12 shrink-0 sm:h-14 sm:w-14"
          priority
        />
      </div>
      <Dashboard />
    </div>
  );
}
