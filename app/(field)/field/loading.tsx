import { Skeleton } from "@/components/ui/skeleton";

export default function FieldLoading() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading jobs">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
