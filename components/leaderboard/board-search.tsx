"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function BoardSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-1 shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border/60 bg-card/50 py-2 pl-9 pr-3",
          "text-base backdrop-blur-xl placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring/50"
        )}
      />
    </div>
  );
}
