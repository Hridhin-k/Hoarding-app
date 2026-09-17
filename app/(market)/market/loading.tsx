import { Skeleton } from "@/components/ui/skeleton";

export default function MarketLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Loading marketplace">
      <div className="flex min-h-0 flex-1 flex-col xl:fixed xl:inset-x-0 xl:top-14 xl:bottom-0 xl:flex-row">
        <Skeleton className="hidden h-full w-[15.5rem] rounded-none xl:block" />
        <div className="flex-1 space-y-4 p-4 xl:w-[min(36vw,28rem)] xl:flex-none xl:border-r">
          <Skeleton className="h-10 w-full rounded-md xl:hidden" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
        </div>
        <Skeleton className="hidden min-h-[24rem] flex-1 rounded-none xl:block" />
      </div>
    </main>
  );
}
