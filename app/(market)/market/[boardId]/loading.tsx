import { Skeleton } from "@/components/ui/skeleton";

export default function MarketBoardLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6" aria-busy="true" aria-label="Loading listing">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-72 rounded-md" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
        <Skeleton className="hidden h-56 rounded-md lg:block" />
      </div>
    </main>
  );
}
