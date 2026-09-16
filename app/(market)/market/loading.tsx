import { Skeleton } from "@/components/ui/skeleton";

export default function MarketLoading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr]" aria-busy="true" aria-label="Loading marketplace">
      <Skeleton className="h-[420px] rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </main>
  );
}
