"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketBrowseLayout({
  list,
  map,
}: {
  list: ReactNode;
  map: ReactNode;
}) {
  const [mode, setMode] = useState<"list" | "map">("list");

  return (
    <div className="space-y-3">
      <div className="flex rounded-md border bg-card p-0.5 xl:hidden" role="tablist" aria-label="List or map">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          className={cn(
            "h-8 flex-1 rounded-[5px] text-sm",
            mode === "list" ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
          )}
          onClick={() => setMode("list")}
        >
          List
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "map"}
          className={cn(
            "h-8 flex-1 rounded-[5px] text-sm",
            mode === "map" ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
          )}
          onClick={() => setMode("map")}
        >
          Map
        </button>
      </div>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] xl:items-start xl:gap-6">
        <div className={mode === "map" ? "hidden xl:block" : undefined}>{list}</div>
        <div
          className={cn(
            mode === "list" ? "hidden xl:block" : undefined,
            "xl:sticky xl:top-16 xl:h-[calc(100dvh-5.5rem)]",
          )}
        >
          {map}
        </div>
      </div>
    </div>
  );
}
