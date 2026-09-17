"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketBrowseLayout({
  filters,
  list,
  map,
}: {
  filters: ReactNode;
  list: ReactNode;
  map: ReactNode;
}) {
  const [mode, setMode] = useState<"list" | "map">("list");

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:fixed xl:inset-x-0 xl:top-14 xl:bottom-0 xl:flex-row">
      <aside className="shrink-0 px-4 pt-4 xl:flex xl:h-full xl:w-[15.5rem] xl:flex-col xl:overflow-y-auto xl:border-r xl:px-4 xl:py-4">
        {filters}
      </aside>
      <div className="px-4 pt-3 xl:hidden">
        <div className="flex rounded-md border bg-card p-0.5" role="tablist" aria-label="List or map">
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
      </div>
      <section
        className={cn(
          mode === "map" && "hidden xl:flex",
          "min-h-0 flex-1 flex-col px-4 py-4 xl:h-full xl:w-[min(36vw,28rem)] xl:flex-none xl:overflow-y-auto xl:border-r",
        )}
      >
        {list}
      </section>
      <section
        aria-label="Marketplace map"
        className={cn(
          mode === "list" && "hidden xl:block",
          "relative min-h-[calc(100dvh-11rem)] flex-1 xl:h-full xl:min-h-0",
        )}
      >
        {map}
      </section>
    </div>
  );
}
