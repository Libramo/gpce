"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AmbientBackground } from "@/components/ambient-background";
import { cn, glassPanel } from "@/lib/utils";

export default function AccesPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch("/api/acces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => null);
    setError(data?.error ?? "Code incorrect.");
    setIsSubmitting(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <AmbientBackground />

      <form
        onSubmit={handleSubmit}
        className={cn(
          glassPanel,
          "relative z-10 flex w-full max-w-xs flex-col gap-4 p-8"
        )}
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Accès requis
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez le code pour accéder au suivi en direct.
          </p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="Code d'accès"
          className="rounded-lg border border-border bg-background/60 px-4 py-3 text-center text-lg tracking-widest text-foreground outline-none focus:border-primary"
        />

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || pin.length === 0}
          className="rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
