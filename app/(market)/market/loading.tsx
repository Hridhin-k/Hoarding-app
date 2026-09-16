import { Skeleton } from "@/components/ui/skeleton";

export default function MarketLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6" aria-busy="true" aria-label="Loading marketplace">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-md lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md lg:hidden" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
        </div>
      </div>
    </main>
  );
}
